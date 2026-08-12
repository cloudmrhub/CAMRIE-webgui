/**
 * Backend body-model isocenter helpers (match CAMRIE-app `compute_auto_isocenter`).
 *
 * Worker SimpleITK space is **LPS**. Niivue `frac2mm` is typically **RAS** and may use a
 * different origin than SITK even after axis flips — so export must be:
 *   `isocenter_lps = auto_lps + signs * (slice_nv - volume_center_nv)`
 * with `auto_lps` from the mid-voxel NIfTI affine (same idea as the worker), not from
 * absolute Niivue millimetres alone.
 *
 * Duke example (from worker logs): auto ≈ `[305, -155, -124.5]` while Niivue volume
 * center can be near `[0,0,0]`. Default FoV must export the auto, not ~0 and not a
 * blind RAS→LPS of a wrong absolute point like `[-298, -155, 124.5]`.
 *
 * @see https://github.com/cloudmrhub/CAMRIE-app/blob/main/calculation/src/app.py
 */

export type Vec3 = [number, number, number];

/** Per-axis signs mapping Niivue offset-mm → backend LPS mm: `lps[i] = signs[i] * niivue[i]`. */
export type NiivueToLpsAxisSigns = Vec3;

export type NiftiLikeHeader = {
  dims: number[];
  pixDims: number[];
  affine?: number[][] | null;
};

/** Niivue volume fields used for a SITK-style center. */
export type NiivueVolumeLike = {
  hdr?: NiftiLikeHeader | null;
  /** Column-major 4×4 (gl-matrix), voxel → world (same space as `frac2mm`). */
  matRAS?: ArrayLike<number> | null;
  dims?: number[] | null;
};

export type BackendWorldFrame = {
  /** Apply to *offsets* when exporting to the worker (axis flips only). */
  axisSigns: NiivueToLpsAxisSigns;
  /** Volume center in LPS mm (SITK mid-voxel). Trusted export anchor. */
  autoIsocenterLpsMm: Vec3 | null;
  /** Volume center from Niivue `frac2mm(0.5³)` in mm. */
  niivueIsocenterMm: Vec3 | null;
  /** NIfTI corner from Niivue `frac2mm(0³)` in mm (debug). */
  niivueOriginMm: Vec3 | null;
  /** How Niivue compared to the SITK-style center. */
  match: "identical" | "ras_vs_lps" | "unknown" | "no_header";
};

const DEFAULT_SIGNS: NiivueToLpsAxisSigns = [1, 1, 1];
const MATCH_TOL_MM = 2;

function applyAffine4(A: number[][], ijk: Vec3): Vec3 {
  return [
    A[0][0] * ijk[0] + A[0][1] * ijk[1] + A[0][2] * ijk[2] + A[0][3],
    A[1][0] * ijk[0] + A[1][1] * ijk[1] + A[1][2] * ijk[2] + A[1][3],
    A[2][0] * ijk[0] + A[2][1] * ijk[1] + A[2][2] * ijk[2] + A[2][3],
  ];
}

function rasToLps(p: Vec3): Vec3 {
  return [-p[0], -p[1], p[2]];
}

export function dist3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function toMmIfMeters(center: Vec3, pixDims: number[]): Vec3 {
  const sp = Math.max(Math.abs(pixDims[1] ?? 0), Math.abs(pixDims[2] ?? 0), Math.abs(pixDims[3] ?? 0));
  if (sp > 0 && sp < 0.1) {
    return [center[0] * 1000, center[1] * 1000, center[2] * 1000];
  }
  return center;
}

/** gl-matrix mat4 (column-major) → row-major 4×4 for {@link applyAffine4}. */
export function mat4ColumnMajorToRowMajor4(m: ArrayLike<number>): number[][] | null {
  if (!m || m.length < 16) return null;
  return [
    [Number(m[0]), Number(m[4]), Number(m[8]), Number(m[12])],
    [Number(m[1]), Number(m[5]), Number(m[9]), Number(m[13])],
    [Number(m[2]), Number(m[6]), Number(m[10]), Number(m[14])],
    [0, 0, 0, 1],
  ];
}

/**
 * Normalize to NIfTI-style dims `[ndim, nx, ny, nz, ...]`.
 * Niivue `volume.dims` is often spatial-first `[nx, ny, nz, (nt)]`.
 */
export function normalizeDimsToNifti(dims: number[] | null | undefined): number[] | null {
  if (!dims || dims.length < 3) return null;
  if (dims.length >= 4 && dims[0] >= 2 && dims[0] <= 7 && (dims[1] ?? 0) >= 1) {
    return dims;
  }
  if ((dims[0] ?? 0) > 7 && (dims[1] ?? 0) >= 1 && (dims[2] ?? 0) >= 1) {
    return [3, dims[0], dims[1], dims[2]];
  }
  return null;
}

function midVoxelIndex(dims: number[]): Vec3 | null {
  const nifti = normalizeDimsToNifti(dims);
  if (!nifti) return null;
  const nx = nifti[1];
  const ny = nifti[2];
  const nz = nifti[3];
  if (!(nx > 0 && ny > 0 && nz > 0)) return null;
  return [(nx - 1) / 2, (ny - 1) / 2, (nz - 1) / 2];
}

/**
 * Volume center in **LPS mm** from a voxel→world affine (RAS as stored by NIfTI/Niivue).
 * Applies RAS→LPS (`[-x,-y,z]`) then m→mm when spacing looks like metres.
 */
export function computeAutoIsocenterLpsMmFromAffine(
  affine: number[][],
  dims: number[],
  pixDims: number[],
): Vec3 | null {
  const ijk = midVoxelIndex(dims);
  if (!ijk) return null;
  if (!Array.isArray(affine) || affine.length < 3 || !affine[0] || affine[0].length < 4) return null;
  const centerNative = applyAffine4(affine, ijk);
  return toMmIfMeters(rasToLps(centerNative), pixDims);
}

export function computeAutoIsocenterLpsMmFromNiftiHdr(hdr: NiftiLikeHeader | null | undefined): Vec3 | null {
  if (!hdr?.dims || !hdr?.pixDims || !hdr.affine) return null;
  return computeAutoIsocenterLpsMmFromAffine(hdr.affine, hdr.dims, hdr.pixDims);
}

export function computeAutoIsocenterLpsMmFromVolume(vol: NiivueVolumeLike | null | undefined): Vec3 | null {
  if (!vol) return null;
  // Prefer hdr.affine (on-disk NIfTI ≈ SITK) over matRAS (Niivue translation can differ).
  const fromHdr = computeAutoIsocenterLpsMmFromNiftiHdr(vol.hdr ?? null);
  if (fromHdr) return fromHdr;

  const pixDims = vol.hdr?.pixDims;
  if (!pixDims) return null;
  const mat = vol.matRAS ? mat4ColumnMajorToRowMajor4(vol.matRAS) : null;
  const dims = normalizeDimsToNifti(vol.hdr?.dims) ?? normalizeDimsToNifti(vol.dims ?? null);
  if (mat && dims) return computeAutoIsocenterLpsMmFromAffine(mat, dims, pixDims);
  return null;
}

/**
 * @deprecated Diagnostic only. Do not reject mid-voxel autos that equal LPS(corner numbers);
 * Duke worker auto is often `[305,-155,-124.5]`.
 */
export function looksLikeOriginTrap(
  autoLpsMm: Vec3,
  niivueIsocenterMm: Vec3,
  niivueOriginMm: Vec3,
): boolean {
  const dOrigin = Math.min(dist3(autoLpsMm, niivueOriginMm), dist3(autoLpsMm, rasToLps(niivueOriginMm)));
  const dCenter = Math.min(dist3(autoLpsMm, niivueIsocenterMm), dist3(autoLpsMm, rasToLps(niivueIsocenterMm)));
  return dOrigin <= MATCH_TOL_MM * 2 && dCenter > MATCH_TOL_MM * 5;
}

export function detectNiivueToLpsAxisSigns(
  niivueIsocenterMm: Vec3 | null,
  autoIsocenterLpsMm: Vec3 | null,
  tolMm = MATCH_TOL_MM,
): { signs: NiivueToLpsAxisSigns; match: BackendWorldFrame["match"] } {
  if (!autoIsocenterLpsMm) {
    return { signs: [...DEFAULT_SIGNS], match: "no_header" };
  }
  if (!niivueIsocenterMm) {
    return { signs: [...DEFAULT_SIGNS], match: "unknown" };
  }

  const flipped: Vec3 = rasToLps(niivueIsocenterMm);
  const dSame = dist3(niivueIsocenterMm, autoIsocenterLpsMm);
  const dFlip = dist3(flipped, autoIsocenterLpsMm);

  if (dSame <= tolMm && dSame <= dFlip) {
    return { signs: [1, 1, 1], match: "identical" };
  }
  if (dFlip <= tolMm) {
    return { signs: [-1, -1, 1], match: "ras_vs_lps" };
  }
  if (dFlip < dSame) {
    return { signs: [-1, -1, 1], match: "unknown" };
  }
  return { signs: [1, 1, 1], match: "unknown" };
}

export function applyAxisSignsToMm(p: Vec3, signs: NiivueToLpsAxisSigns): Vec3 {
  return [p[0] * signs[0], p[1] * signs[1], p[2] * signs[2]];
}

export function applyAxisSignsToAffine(
  a: [
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
  ],
  signs: NiivueToLpsAxisSigns,
): typeof a {
  return [
    [a[0][0] * signs[0], a[0][1] * signs[0], a[0][2] * signs[0], a[0][3] * signs[0]],
    [a[1][0] * signs[1], a[1][1] * signs[1], a[1][2] * signs[1], a[1][3] * signs[1]],
    [a[2][0] * signs[2], a[2][1] * signs[2], a[2][2] * signs[2], a[2][3] * signs[2]],
    [0, 0, 0, 1],
  ];
}

/**
 * Always trusts mid-voxel SITK-style `autoIsocenterLpsMm` when the header allows it.
 * Never reject large-magnitude autos (Duke worker auto ≈ `[305,-155,-124.5]`).
 */
export function resolveBackendWorldFrame(
  hdr: NiftiLikeHeader | null | undefined,
  niivueIsocenterMm: Vec3 | null,
  niivueOriginMm?: Vec3 | null,
  volume?: NiivueVolumeLike | null,
): BackendWorldFrame {
  let autoIsocenterLpsMm =
    computeAutoIsocenterLpsMmFromVolume(volume ?? { hdr }) ??
    computeAutoIsocenterLpsMmFromNiftiHdr(hdr);

  const detected = detectNiivueToLpsAxisSigns(niivueIsocenterMm, autoIsocenterLpsMm);
  const signs = detected.signs;
  const match = detected.match;

  if (!autoIsocenterLpsMm && niivueIsocenterMm) {
    autoIsocenterLpsMm = applyAxisSignsToMm(niivueIsocenterMm, signs);
  }

  return {
    axisSigns: signs,
    autoIsocenterLpsMm,
    niivueIsocenterMm,
    niivueOriginMm: niivueOriginMm ?? null,
    match,
  };
}

/**
 * `auto + signs * (slice_nv - volume_center_nv)` so Duke default FoV exports worker auto
 * even when Niivue shows the volume center near `[0,0,0]`.
 */
export function sliceCenterNiivueMmToLpsMm(
  sliceCenterNiivueMm: Vec3 | null,
  backendWorld?: Pick<
    BackendWorldFrame,
    "axisSigns" | "autoIsocenterLpsMm" | "niivueIsocenterMm"
  > | null,
): Vec3 | null {
  if (!sliceCenterNiivueMm) return null;
  const signs: NiivueToLpsAxisSigns = backendWorld?.axisSigns ?? [1, 1, 1];
  const auto = backendWorld?.autoIsocenterLpsMm ?? null;
  const volNv = backendWorld?.niivueIsocenterMm ?? null;

  if (auto && volNv) {
    const offset: Vec3 = [
      sliceCenterNiivueMm[0] - volNv[0],
      sliceCenterNiivueMm[1] - volNv[1],
      sliceCenterNiivueMm[2] - volNv[2],
    ];
    return [
      auto[0] + signs[0] * offset[0],
      auto[1] + signs[1] * offset[1],
      auto[2] + signs[2] * offset[2],
    ];
  }
  return applyAxisSignsToMm(sliceCenterNiivueMm, signs);
}
