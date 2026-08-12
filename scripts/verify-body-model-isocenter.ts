/**
 * End-to-end checks for Duke / IXI isocenter expectations.
 * Run: npx tsx scripts/verify-body-model-isocenter.ts
 *
 * Ground truth from worker logs (Duke):
 *   Auto-detected center: [305.0, -155.0, -124.5]
 * Frontend must export that for default FoV (zero offset), not [0,0,0] and not a
 * wrong-signed absolute Niivue point like [-298, -155, 124.5].
 */
import {
  computeAutoIsocenterLpsMmFromAffine,
  normalizeDimsToNifti,
  resolveBackendWorldFrame,
  sliceCenterNiivueMmToLpsMm,
  dist3,
  type Vec3,
} from "../src/common/utilities/bodyModelIsocenter";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function near(a: Vec3, b: Vec3, tol = 1e-3): boolean {
  return dist3(a, b) <= tol;
}

const dukePix = [1, 1, 1, 1];
/**
 * RAS affine whose mid-voxel LPS center matches the worker:
 * rasToLps(RAS_mid) = [305, -155, -124.5] ⇒ RAS_mid = [-305, 155, -124.5]
 * With dims 611×311×249, origin RAS = mid - (dims-1)/2.
 */
const dukeAutoLps: Vec3 = [305, -155, -124.5];
const dukeCenterRas: Vec3 = [-305, 155, -124.5]; // mid-voxel in RAS (= rasToLps^{-1}(auto))
const dukeDims = [3, 611, 311, 249];
const half = [(dukeDims[1] - 1) / 2, (dukeDims[2] - 1) / 2, (dukeDims[3] - 1) / 2];
const dukeOriginRas: Vec3 = [
  dukeCenterRas[0] - half[0],
  dukeCenterRas[1] - half[1],
  dukeCenterRas[2] - half[2],
];
const dukeAffine = [
  [1, 0, 0, dukeOriginRas[0]],
  [0, 1, 0, dukeOriginRas[1]],
  [0, 0, 1, dukeOriginRas[2]],
  [0, 0, 0, 1],
];

const autoDuke = computeAutoIsocenterLpsMmFromAffine(dukeAffine, dukeDims, dukePix);
assert(autoDuke != null && near(autoDuke, dukeAutoLps, 1), `Duke auto ${autoDuke} ≈ ${dukeAutoLps}`);

// A: Niivue shows center near 0 (different origin than SITK) — still export worker auto
{
  const niivueCenter: Vec3 = [0, 0, 0];
  const niivueOrigin: Vec3 = [-305, 155, -124.5];
  const frame = resolveBackendWorldFrame(
    { dims: dukeDims, pixDims: dukePix, affine: dukeAffine },
    niivueCenter,
    niivueOrigin,
  );
  assert(frame.autoIsocenterLpsMm != null && near(frame.autoIsocenterLpsMm, dukeAutoLps, 1), `A auto ${frame.autoIsocenterLpsMm}`);
  const exported = sliceCenterNiivueMmToLpsMm(niivueCenter, frame);
  assert(exported != null && near(exported, dukeAutoLps, 1), `A: default FoV must be worker auto, got ${exported}`);
}

// B: must NOT export the bad value from the latest failed job
{
  const bad: Vec3 = [-298.89, -154.717, 124.5];
  const frame = resolveBackendWorldFrame(
    { dims: dukeDims, pixDims: dukePix, affine: dukeAffine },
    [0, 0, 0],
    [-305, 155, -124.5],
  );
  const exported = sliceCenterNiivueMmToLpsMm([0, 0, 0], frame)!;
  assert(dist3(exported, bad) > 50, `B: must not export failed-job isocenter ${bad}, got ${exported}`);
  assert(near(exported, dukeAutoLps, 1), `B: got ${exported}`);
}

// C: user +10 mm offset in Niivue X preserved (with detected signs)
{
  const frame = resolveBackendWorldFrame(
    { dims: dukeDims, pixDims: dukePix, affine: dukeAffine },
    [0, 0, 0],
    [-305, 155, -124.5],
  );
  const exported = sliceCenterNiivueMmToLpsMm([10, 0, 0], frame)!;
  const dx = Math.abs(exported[0] - dukeAutoLps[0]);
  assert(Math.abs(dx - 10) < 0.1, `C: 10mm offset, got ${exported}`);
}

// D: IXI-like near-origin stays small
{
  const ixiCenter: Vec3 = [2.5, -1.2, 0.8];
  const ixiOrigin: Vec3 = [-90, -90, -90];
  const ixiAffine = [
    [1, 0, 0, ixiOrigin[0]],
    [0, 1, 0, ixiOrigin[1]],
    [0, 0, 1, ixiOrigin[2]],
    [0, 0, 0, 1],
  ];
  const ixiDims = [
    3,
    Math.round((ixiCenter[0] - ixiOrigin[0]) * 2) + 1,
    Math.round((ixiCenter[1] - ixiOrigin[1]) * 2) + 1,
    Math.round((ixiCenter[2] - ixiOrigin[2]) * 2) + 1,
  ];
  const frame = resolveBackendWorldFrame(
    { dims: ixiDims, pixDims: dukePix, affine: ixiAffine },
    ixiCenter,
    ixiOrigin,
  );
  const exported = sliceCenterNiivueMmToLpsMm(ixiCenter, frame)!;
  assert(Math.hypot(...exported) < 20, `D: IXI near origin, got ${exported}`);
}

assert(
  JSON.stringify(normalizeDimsToNifti([256, 256, 128])) === JSON.stringify([3, 256, 256, 128]),
  "spatial-first dims",
);

console.log("OK — Duke exports worker auto [305,-155,-124.5]; IXI still near 0");
