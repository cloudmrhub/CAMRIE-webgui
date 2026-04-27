import { NVMesh } from "@niivue/niivue";

/** Upper clamp for legacy volume-relative FOV box scale (when axial FoV is not used). */
export const FOV_BOX_SCALE_MAX = 1.1;

/** Lower clamp for legacy volume-relative FOV box scale. */
export const FOV_BOX_SCALE_MIN = 0.25;

/** Same scaling applied to the mesh and what the UI should display. */
export function clampFovBoxScale(scale: number | undefined): number {
  const raw = scale === undefined ? 1 : Number(scale);
  const n = Number.isFinite(raw) ? raw : 1;
  return Math.min(FOV_BOX_SCALE_MAX, Math.max(FOV_BOX_SCALE_MIN, n));
}

/** Prescribed sequence FoV in millimetres (FoVx = pixels × resolution, same for y). */
export type AxialFovMm = {
  fovXMm: number;
  fovYMm: number;
};

/**
 * Same convention as Niivue `createOnLocationChange`: slice matrix (`frac2mm`, `isSliceMM`), not `frac2mmOrtho`.
 * Returns **Niivue native world units** (often metres), not necessarily millimetres — see {@link getMmToNiivueWorldScale}.
 */
function sliceMmFromFrac(nv: { frac2mm: (...args: unknown[]) => unknown }, frac: number[]): number[] {
  return nv.frac2mm([frac[0], frac[1], frac[2]], 0, true) as number[];
}

/**
 * UI and sequence JSON use millimetres; Niivue `frac2mm` world positions are often **metres** (~0.2 for a 200 mm extent).
 * Returns the factor such that: `positionInNiivueWorld = lengthInMm * factor`.
 */
function getMmToNiivueWorldScale(minB: number[], maxB: number[]): number {
  const extent = Math.max(maxB[0] - minB[0], maxB[1] - minB[1], maxB[2] - minB[2]);
  if (extent > 100) return 1;
  if (extent < 1) return 0.001;
  return 0.001;
}

/** Inverse of {@link getMmToNiivueWorldScale} — converts Niivue world length/position to millimetres. */
function niivueWorldToMm(v: number[], minB: number[], maxB: number[]): number[] {
  const inv = 1 / getMmToNiivueWorldScale(minB, maxB);
  return [v[0] * inv, v[1] * inv, v[2] * inv];
}

/** Millimetre displacement in world space → Niivue native (same scale on all axes). */
function mmVecToNiivueNative(mm: number[], minB: number[], maxB: number[]): number[] {
  const s = getMmToNiivueWorldScale(minB, maxB);
  return [mm[0] * s, mm[1] * s, mm[2] * s];
}

/** Multi-slice axial stack: through-plane axis = voxel k̂ (cross of in-plane î,ĵ); slice centers spaced by thickness + gap. */
export type AxialSliceStackMm = {
  numSlices: number;
  sliceThicknessMm: number;
  sliceGapMm: number;
};

/** Standard plane relative to world mm (patient-fixed, head-first: +x toward left, +y toward posterior, +z toward superior). */
export type FovPlaneOrientation = "axial" | "sagittal" | "coronal";

/**
 * User-facing slice geometry (orientation + angulation). Internally we derive unit slice normal **N**, orthonormal
 * row/column (FoVx/FoVy), and the 3×3 image-to-world rotation [row | col | slice] for mesh / affine use.
 */
export type FovImagePrescription = {
  orientation: FovPlaneOrientation;
  /**
   * Rotation about world +x (left–right axis), degrees, applied before {@link angulationAPdeg}. For an **axial** slice this
   * tilts the slice normal in the sagittal plane (anterior–posterior obliquity); see {@link applyWorldAxisAngulation}.
   */
  angulationLRdeg: number;
  /**
   * Rotation about world +y (anterior–posterior axis), degrees, after {@link angulationLRdeg}. For **axial**, this tilts the normal in the
   * coronal plane (left–right obliquity).
   */
  angulationAPdeg: number;
  /**
   * **Z** angulation: rotation about the slice normal **after** LR/AP tilts (degrees, right-hand rule with slice = row × col).
   * Spins readout vs phase in the slice plane without changing the plane orientation. Omitted / undefined treated as 0.
   */
  angulationZDeg?: number;
};

export type FovBoxOptions = {
  /** Used only when `axialFovMm` is absent or invalid: scale extent relative to volume world AABB. */
  scale?: number;
  /** When set with positive finite FoV lengths, draws an axial (i–j plane) rectangle at volume isocenter (0.5³ frac), clipped to the volume. */
  axialFovMm?: AxialFovMm;
  /**
   * Translation of the **slice group center** (central slice of a multi-slice stack) from the **volume isocenter**,
   * in **millimetres** in CAMRIE world axes (+x toward left, +y toward posterior, +z toward superior; patient-fixed, head-first; same frame as {@link imageBasisFromOrientationAngulation}).
   * When set, this drives placement; otherwise legacy {@link NiivueMeshHost.__camrieFovUserTransform} `offsetMm` (native units) is used.
   */
  sliceOffsetWorldMm?: [number, number, number];
  /**
   * When set, FoV follows cardinal orientation + LR/AP angulation (computed internally); otherwise voxel i/j/k basis.
   */
  imagePrescription?: FovImagePrescription;
  /** Wireframe slab boxes for each slice (thickness + gap); same in-plane half-extents as axial FoV after clamp. */
  axialSliceStack?: AxialSliceStackMm;
  /** RGBA 0–255. */
  rgba255?: [number, number, number, number];
  /** Combined opacity 0–1 (in addition to rgba alpha in shader path). */
  opacity?: number;
  /**
   * Optional extra multiplier on **all** 2D slice tiles (0–1), applied after per-view scales. Default `1`.
   * Prefer {@link sliceFillOpacityByView} for axial vs coronal vs sagittal.
   */
  sliceFillOpacityScale2D?: number;
  /**
   * Per-view multipliers for the yellow slice-volume fill (relative to `fillMesh.opacity`). All default to `1` except
   * the built-in {@link DEFAULT_SLICE_FILL_OPACITY_BY_VIEW} when this object is omitted entirely.
   * Omitted keys fall back to those defaults so coronal/sagittal/3D can read stronger than axial.
   */
  sliceFillOpacityByView?: SliceFillOpacityByView;
  name?: string;
  /**
   * When true, **Alt+drag** translates FoV meshes in world mm (Niivue `screenXY2mm`). **Alt+Ctrl+drag** adjusts
   * LR/AP angulation if {@link fovInteractive.onAngulationSetDeg} is provided. Horizontal delta → LR°, vertical → AP°
   * (diagonal changes both). **Shift** = finer steps. Optional {@link fovInteractive.lockAngulationLR} /
   * {@link fovInteractive.lockAngulationAP} freeze that axis during canvas drag (see Setup Angle checkboxes).
   */
  fovInteractive?: {
    enabled?: boolean;
    /**
     * Called while Alt+Ctrl+dragging with absolute angles (deg), clamped ±89.5° here; parent should mirror into the
     * same LR/AP fields as the angulation inputs.
     */
    onAngulationSetDeg?: (angulationLRdeg: number, angulationAPdeg: number) => void;
    /**
     * Alt+drag translation: absolute slice offset (mm, world axes), same triple as {@link FovBoxOptions.sliceOffsetWorldMm}.
     * Parent should mirror into Setup numeric fields.
     */
    onSliceOffsetMmChange?: (offsetWorldMm: [number, number, number]) => void;
    /** When true, canvas angulation drag does not change LR° (only AP updates, if not also locked). */
    lockAngulationLR?: boolean;
    /** When true, canvas angulation drag does not change AP° (only LR updates, if not also locked). */
    lockAngulationAP?: boolean;
    /** When true, Alt+drag translation is disabled (angulation drag still works if enabled). */
    lockTranslate?: boolean;
    /**
     * When true, plain left-button drag activates the FoV interaction without requiring Alt.
     * The drag mode (translate vs angulation) is inferred from the lock flags: if `lockTranslate`
     * is set the drag angulates; if both angulation axes are locked the drag translates.
     */
    altFree?: boolean;
  };
  /**
   * When false, user offset from dragging is cleared on the next `attachFovBoundingBoxMesh`. Default true so
   * React option refreshes do not reset the pose.
   */
  preserveFovUserTransform?: boolean;
};

/** User-applied translation on top of volume isocenter (for drag + backend export). Angulation lives in `imagePrescription`. */
export type FovUserMeshTransform = {
  offsetMm: [number, number, number];
};

/**
 * Last placed FoV mesh pose in **Niivue native world units** (same as `frac2mm`); field names use `Mm` historically.
 * For export, use {@link getFovMeshAffineSnapshot} which converts positions/extents to physical millimetres.
 */
export type FovMeshGeometrySnapshot = {
  centerMm: number[];
  row: number[];
  col: number[];
  slice: number[];
  halfExtentXMm: number;
  halfExtentYMm: number;
};

/**
 * Axial / coronal / sagittal 2D tiles and the 3D render panel.
 * Values are **multipliers** on fill strength (see {@link DEFAULT_SLICE_FILL_OPACITY_BY_VIEW}).
 */
export type SliceFillOpacityByView = {
  axial?: number;
  coronal?: number;
  sagittal?: number;
  /** 3D multiplanar render tile. */
  view3d?: number;
};

/**
 * Default per-view **multipliers** for yellow fill strength (not 0–100% UI opacity).
 * They multiply the same base as everywhere else (`fillMesh.opacity` × shader). Examples: `1` = baseline;
 * `0.5` ≈ half that strength on that tile; `1.5` = 50% stronger than baseline.
 * When passing `sliceFillOpacityByView`, unspecified keys use these values.
 */
export const DEFAULT_SLICE_FILL_OPACITY_BY_VIEW: Required<SliceFillOpacityByView> = {
  axial: 6,
  coronal: 6,
  sagittal: 6,
  view3d: 2,
};

/**
 * Multiplier used for the view tile that matches the **active prescription orientation**.
 * The selected plane looks at the slice face-on, so a lower value prevents it from
 * appearing over-saturated compared to the orthogonal tiles.
 */
export const ACTIVE_ORIENTATION_SLICE_FILL_OPACITY = 0.5;

/** Default extra dimming for slice fill on 2D (see `FovBoxOptions.sliceFillOpacityScale2D`). */
export const DEFAULT_SLICE_FILL_OPACITY_SCALE_2D = 1;

function clampSliceFillOpacityScale(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 1;
  return Math.min(20, n);
}

/**
 * Merge caller-supplied per-view overrides with defaults.
 *
 * When `activeOrientation` is provided (from `imagePrescription.orientation`),
 * the matching 2D tile defaults to {@link ACTIVE_ORIENTATION_SLICE_FILL_OPACITY}
 * instead of the normal `6` — unless the caller explicitly sets that key in
 * `partial`. The orthogonal tiles always keep their standard defaults.
 */
function mergeSliceFillOpacityByView(
  partial?: SliceFillOpacityByView,
  activeOrientation?: FovPlaneOrientation,
): { axial: number; coronal: number; sagittal: number; view3d: number } {
  const b = DEFAULT_SLICE_FILL_OPACITY_BY_VIEW;
  const active = ACTIVE_ORIENTATION_SLICE_FILL_OPACITY;

  const defaultFor = (key: "axial" | "coronal" | "sagittal"): number =>
    activeOrientation === key ? active : b[key];

  return {
    axial: clampSliceFillOpacityScale(partial?.axial !== undefined ? partial.axial : defaultFor("axial")),
    coronal: clampSliceFillOpacityScale(partial?.coronal !== undefined ? partial.coronal : defaultFor("coronal")),
    sagittal: clampSliceFillOpacityScale(partial?.sagittal !== undefined ? partial.sagittal : defaultFor("sagittal")),
    view3d: clampSliceFillOpacityScale(partial?.view3d !== undefined ? partial.view3d : b.view3d),
  };
}

/**
 * Axis-aligned bounds of the volume in **Niivue world coordinates** (same units as `frac2mm`, often metres).
 * Name suffix "Mm" is historical; use {@link getMmToNiivueWorldScale} when mixing with UI mm.
 */
export function volumeWorldAabbMm(nv: { frac2mm: (...args: unknown[]) => unknown }): { min: number[]; max: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (let i = 0; i <= 1; i++) {
    for (let j = 0; j <= 1; j++) {
      for (let k = 0; k <= 1; k++) {
        const p = sliceMmFromFrac(nv, [i, j, k]) as number[] | Float32Array;
        xs.push(p[0]);
        ys.push(p[1]);
        zs.push(p[2]);
      }
    }
  }
  return {
    min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)],
    max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)],
  };
}

export function volumeIsocenterMm(nv: { frac2mm: (...args: unknown[]) => unknown }): number[] {
  return sliceMmFromFrac(nv, [0.5, 0.5, 0.5]);
}

/**
 * Volume AABB extents in **physical millimetres** along the three patient axes
 * (patient-fixed head-first: +x = left, +y = posterior, +z = superior).
 * Unlike {@link volumeWorldAabbMm} these are always in mm regardless of whether
 * Niivue stores coordinates in metres or millimetres internally.
 */
export function volumePhysicalExtentMm(nv: { frac2mm: (...args: unknown[]) => unknown }): {
  lrMm: number;
  apMm: number;
  siMm: number;
} {
  const { min, max } = volumeWorldAabbMm(nv);
  const scale = getMmToNiivueWorldScale(min, max); // mm → world
  const inv = scale > 0 ? 1 / scale : 1; // world → mm
  return {
    lrMm: (max[0] - min[0]) * inv,
    apMm: (max[1] - min[1]) * inv,
    siMm: (max[2] - min[2]) * inv,
  };
}

function vsub(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vadd(a: number[], b: number[]): number[] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vscale(v: number[], s: number): number[] {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function vdot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function vlen(a: number[]): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function vnorm(a: number[]): number[] {
  const L = vlen(a);
  if (L < 1e-20) return [1, 0, 0];
  return [a[0] / L, a[1] / L, a[2] / L];
}

function cross(a: number[], b: number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function isValidAxialFovMm(af: AxialFovMm | undefined): af is AxialFovMm {
  if (!af) return false;
  const x = Number(af.fovXMm);
  const y = Number(af.fovYMm);
  return Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0;
}

export function isValidAxialSliceStack(st: AxialSliceStackMm | undefined): st is AxialSliceStackMm {
  if (!st) return false;
  const n = Math.round(Number(st.numSlices));
  const t = Number(st.sliceThicknessMm);
  const g = Number(st.sliceGapMm);
  return Number.isFinite(n) && n >= 1 && Number.isFinite(t) && t > 0 && Number.isFinite(g) && g >= 0;
}

// function pointInAabb(p: number[], min: number[], max: number[]): boolean {
//   const e = 1e-4;
//   return p[0] >= min[0] - e && p[0] <= max[0] + e && p[1] >= min[1] - e && p[1] <= max[1] + e && p[2] >= min[2] - e && p[2] <= max[2] + e;
// }

// function cornersInside(
//   C: number[],
//   u0: number[],
//   u1: number[],
//   h0: number,
//   h1: number,
//   min: number[],
//   max: number[],
// ): boolean {
//   const signs: [number, number][] = [
//     [-1, -1],
//     [1, -1],
//     [1, 1],
//     [-1, 1],
//   ];
//   for (const [s0, s1] of signs) {
//     const p = [C[0] + s0 * h0 * u0[0] + s1 * h1 * u1[0], C[1] + s0 * h0 * u0[1] + s1 * h1 * u1[1], C[2] + s0 * h0 * u0[2] + s1 * h1 * u1[2]];
//     if (!pointInAabb(p, min, max)) return false;
//   }
//   return true;
// }

// /** Uniformly scale half-extents so all four in-plane corners stay inside the volume AABB (same aspect). */
// export function clampHalvesUniformToVolumeAabb(
//   C: number[],
//   u0: number[],
//   u1: number[],
//   h0: number,
//   h1: number,
//   min: number[],
//   max: number[],
// ): { h0: number; h1: number } {
//   if (h0 <= 0 || h1 <= 0) return { h0: 0, h1: 0 };
//   if (cornersInside(C, u0, u1, h0, h1, min, max)) return { h0, h1 };
//   let lo = 0;
//   let hi = 1;
//   for (let i = 0; i < 48; i++) {
//     const m = (lo + hi) / 2;
//     if (cornersInside(C, u0, u1, h0 * m, h1 * m, min, max)) lo = m;
//     else hi = m;
//   }
//   return { h0: h0 * lo, h1: h1 * lo };
// }

/** In-plane axes from voxel i/j steps in slice mm (Gram–Schmidt so u1 ⊥ u0). */
function volumeInPlaneAxesMm(nv: { frac2mm: (...args: unknown[]) => unknown }): { u0: number[]; u1: number[] } {
  const o = sliceMmFromFrac(nv, [0, 0, 0]);
  const dx = vsub(sliceMmFromFrac(nv, [1, 0, 0]), o);
  const dy = vsub(sliceMmFromFrac(nv, [0, 1, 0]), o);
  let u0 = vnorm(dx);
  const dyProj = vsub(dy, vscale(u0, vdot(dy, u0)));
  let u1 = vlen(dyProj) > 1e-8 ? vnorm(dyProj) : vnorm(cross(u0, [0, 0, 1]));
  if (vlen(u1) < 1e-8) u1 = vnorm(cross(u0, [0, 1, 0]));
  return { u0, u1 };
}

/** Right-handed image basis: row (X), column (Y), slice (Z), with slice = row × column. */
export type VolumeImageBasisMm = { row: number[]; col: number[]; slice: number[] };

export function volumeImageBasisMm(nv: { frac2mm: (...args: unknown[]) => unknown }): VolumeImageBasisMm {
  const { u0, u1 } = volumeInPlaneAxesMm(nv);
  const row = vnorm(u0);
  const slice = vnorm(cross(u0, u1));
  const col = vnorm(cross(slice, row));
  return { row, col, slice };
}

/** Rodrigues: rotate v about unit axis k by deg (degrees), right-hand rule. */
function rodriguesRotateVector(v: number[], k: number[], deg: number): number[] {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const kk = vnorm(k);
  return vadd(vadd(vscale(v, c), vscale(cross(kk, v), s)), vscale(kk, vdot(kk, v) * (1 - c)));
}

const WORLD_LR = [1, 0, 0];
const WORLD_AP = [0, 1, 0];

/**
 * Cardinal image basis before angulation: row × col = slice (RAS-style world slice-mm).
 * Columns of the 3×3 image→world rotation are [row, col, slice].
 */
function baseImageBasisWorld(orientation: FovPlaneOrientation): VolumeImageBasisMm {
  switch (orientation) {
    case "axial":
      return { row: [1, 0, 0], col: [0, 1, 0], slice: [0, 0, 1] };
    case "sagittal":
      return { row: [0, 1, 0], col: [0, 0, 1], slice: [1, 0, 0] };
    case "coronal":
      return { row: [0, 0, 1], col: [1, 0, 0], slice: [0, 1, 0] };
    default:
      return { row: [1, 0, 0], col: [0, 1, 0], slice: [0, 0, 1] };
  }
}

/** Apply LR (+x) then AP (+y) world angulation to the full row/col/slice triad. */
function applyWorldAxisAngulation(
  basis: VolumeImageBasisMm,
  angulationLRdeg: number,
  angulationAPdeg: number,
): VolumeImageBasisMm {
  let { row, col, slice } = basis;
  const lr = Number.isFinite(angulationLRdeg) ? angulationLRdeg : 0;
  const ap = Number.isFinite(angulationAPdeg) ? angulationAPdeg : 0;

  const rotTriad = (deg: number, axis: number[]) => {
    if (Math.abs(deg) < 1e-12) return;
    const k = vnorm(axis);
    row = vnorm(rodriguesRotateVector(row, k, deg));
    col = vnorm(rodriguesRotateVector(col, k, deg));
    slice = vnorm(rodriguesRotateVector(slice, k, deg));
  };

  rotTriad(lr, WORLD_LR);
  rotTriad(ap, WORLD_AP);

  row = vnorm(row);
  col = vsub(col, vscale(row, vdot(row, col)));
  if (vlen(col) < 1e-12) {
    return basis;
  }
  col = vnorm(col);
  const sl = vnorm(cross(row, col));
  if (vdot(sl, slice) < 0) {
    col = vscale(col, -1);
  }
  slice = vnorm(cross(row, col));
  return { row, col, slice };
}

/** Z rotation about slice normal after LR/AP world tilts (row/col spin; normal unchanged up to re-orthonormalize). */
function applyInPlaneAngulation(basis: VolumeImageBasisMm, angulationZDeg: number): VolumeImageBasisMm {
  let { row, col, slice } = basis;
  const d = Number.isFinite(angulationZDeg) ? angulationZDeg : 0;
  if (Math.abs(d) < 1e-12) {
    return { row: [...row], col: [...col], slice: [...slice] };
  }
  const k = vnorm(slice);
  row = vnorm(rodriguesRotateVector(row, k, d));
  col = vnorm(rodriguesRotateVector(col, k, d));
  row = vnorm(row);
  col = vsub(col, vscale(row, vdot(row, col)));
  if (vlen(col) < 1e-12) {
    return basis;
  }
  col = vnorm(col);
  let sl = vnorm(cross(row, col));
  if (vdot(sl, k) < 0) {
    col = vnorm(vscale(col, -1));
    sl = vnorm(cross(row, col));
  }
  return { row, col, slice: sl };
}

/**
 * Full orthonormal basis from UI slice orientation. Slice normal **N** = `basis.slice` (unit); use for stack direction.
 * Image→world linear map (columns): **R** = [row | col | slice] (direction cosines in mm).
 * Order: cardinal orientation → LR (+x) → AP (+y) → Z (about slice normal).
 */
export function imageBasisFromOrientationAngulation(
  orientation: FovPlaneOrientation,
  angulationLRdeg: number,
  angulationAPdeg: number,
  angulationZDeg?: number,
): VolumeImageBasisMm {
  const tilted = applyWorldAxisAngulation(
    baseImageBasisWorld(orientation),
    angulationLRdeg,
    angulationAPdeg,
  );
  return applyInPlaneAngulation(tilted, angulationZDeg ?? 0);
}

/**
 * Advanced: build row/col/slice from an explicit unit slice normal (e.g. programmatic API).
 * FoVx along row, FoVy along column, row × col = N.
 */
export function imageBasisFromSliceNormal(nx: number, ny: number, nz: number): VolumeImageBasisMm {
  const raw = [nx, ny, nz];
  let n: number[];
  if (vlen(raw) < 1e-12 || !raw.every((c) => Number.isFinite(c))) {
    n = [0, 0, 1];
  } else {
    n = vnorm(raw);
  }
  let ref = [0, 0, 1];
  if (Math.abs(vdot(n, ref)) > 0.95) ref = [1, 0, 0];
  const row = vnorm(cross(ref, n));
  const col = vnorm(cross(n, row));
  return { row, col, slice: n };
}

/** Axial slice normal (through-plane / k̂) in mm, orthogonal to î and ĵ. */
function throughPlaneAxisMm(nv: { frac2mm: (...args: unknown[]) => unknown }): number[] | null {
  const { u0, u1 } = volumeInPlaneAxesMm(nv);
  const n = cross(u0, u1);
  if (vlen(n) < 1e-12) return null;
  return vnorm(n);
}

/**
 * Same quad with both triangle windings. Niivue's meshXRay pass uses back-face culling; a flat ring in the
 * slice plane can lose most faces if only one winding is emitted — looks like a single stray triangle.
 */
function appendQuadTwoSided(positions: number[], indices: number[], a: number[], b: number[], c: number[], d: number[]) {
  const base = positions.length / 3;
  positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
  indices.push(
    base,
    base + 1,
    base + 2,
    base,
    base + 2,
    base + 3,
    base,
    base + 2,
    base + 1,
    base,
    base + 3,
    base + 2,
  );
}

function appendRibbonAlongEdge(
  positions: number[],
  indices: number[],
  p0: number[],
  p1: number[],
  bitangentUnit: number[],
  widthMm: number,
) {
  const w = widthMm * 0.5;
  const o = vscale(bitangentUnit, w);
  const a = vadd(p0, o);
  const b = vadd(p1, o);
  const c = vsub(p1, o);
  const d = vsub(p0, o);
  appendQuadTwoSided(positions, indices, a, b, c, d);
}

/** Eight world-space corners of one prescribed slice slab (half-thickness hT along n̂). */
function slabCornersWorld(
  Ck: number[],
  u0: number[],
  u1: number[],
  nHat: number[],
  h0: number,
  h1: number,
  hT: number,
): number[][] {
  const corner = (a: number, b: number, c: number) =>
    vadd(vadd(vadd(Ck, vscale(u0, a)), vscale(u1, b)), vscale(nHat, c));
  return [
    corner(-h0, -h1, -hT),
    corner(h0, -h1, -hT),
    corner(h0, h1, -hT),
    corner(-h0, h1, -hT),
    corner(-h0, -h1, hT),
    corner(h0, -h1, hT),
    corner(h0, h1, hT),
    corner(-h0, h1, hT),
  ];
}

/**
 * Top + bottom face outlines only (8 ribbon edges). Omits the 4 edges parallel to n̂ — those ribbons face the
 * sagittal/coronal planes and read as thick “planes”; in-plane edges look line-like when viewed obliquely.
 * Thickness along the stack is still visible as the gap between the two rectangles.
 */
function appendSlabWireframeTopBottomOnly(
  positions: number[],
  indices: number[],
  Ck: number[],
  u0: number[],
  u1: number[],
  nHat: number[],
  h0: number,
  h1: number,
  hT: number,
  lineWidthMm: number,
) {
  const nu0 = vscale(u0, -1);
  const nu1 = vscale(u1, -1);

  const c = slabCornersWorld(Ck, u0, u1, nHat, h0, h1, hT);

  const lw = lineWidthMm;

  appendRibbonAlongEdge(positions, indices, c[0], c[1], u1, lw);
  appendRibbonAlongEdge(positions, indices, c[1], c[2], nu0, lw);
  appendRibbonAlongEdge(positions, indices, c[2], c[3], nu1, lw);
  appendRibbonAlongEdge(positions, indices, c[3], c[0], u0, lw);
  appendRibbonAlongEdge(positions, indices, c[4], c[5], u1, lw);
  appendRibbonAlongEdge(positions, indices, c[5], c[6], nu0, lw);
  appendRibbonAlongEdge(positions, indices, c[6], c[7], nu1, lw);
  appendRibbonAlongEdge(positions, indices, c[7], c[4], u0, lw);
}

function sliceStackScaledGeometry(
  C: number[],
  nHat: number[],
  numSlices: number,
  thicknessMm: number,
  gapMm: number,
  minB: number[],
  maxB: number[],
): { N: number; sp2: number; hT: number } | null {
  const N = Math.max(1, Math.round(numSlices));
  const unitScale = getMmToNiivueWorldScale(minB, maxB);
  const T = Math.max(1e-12, thicknessMm * unitScale);
  const G = Math.max(0, gapMm * unitScale);
  const sp2 = T + G;
  const hT = T / 2;
  return { N, sp2, hT };
}

/** Translucent fill of the prescribed slice volume (six faces, two-sided) — shows thickness in sagittal/coronal/3D. */
function appendSlabSolidFillFaces(positions: number[], indices: number[], corners: number[][]) {
  const Q = (i: number) => corners[i];
  appendQuadTwoSided(positions, indices, Q(0), Q(1), Q(2), Q(3));
  appendQuadTwoSided(positions, indices, Q(4), Q(5), Q(6), Q(7));
  appendQuadTwoSided(positions, indices, Q(0), Q(1), Q(5), Q(4));
  appendQuadTwoSided(positions, indices, Q(1), Q(2), Q(6), Q(5));
  appendQuadTwoSided(positions, indices, Q(2), Q(3), Q(7), Q(6));
  appendQuadTwoSided(positions, indices, Q(3), Q(0), Q(4), Q(7));
}

function buildAxialSliceStackSolidFillBuffers(
  C: number[],
  u0: number[],
  u1: number[],
  nHat: number[],
  h0: number,
  h1: number,
  numSlices: number,
  thicknessMm: number,
  gapMm: number,
  minB: number[],
  maxB: number[],
): { positions: Float32Array; indices: Uint32Array } | null {
  const g = sliceStackScaledGeometry(C, nHat, numSlices, thicknessMm, gapMm, minB, maxB);
  if (!g) return null;
  const { N, sp2, hT } = g;

  const positions: number[] = [];
  const indices: number[] = [];

  for (let k = 0; k < N; k++) {
    const t = (k - (N - 1) / 2) * sp2;
    const Ck = vadd(C, vscale(nHat, t));
    const corners = slabCornersWorld(Ck, u0, u1, nHat, h0, h1, hT);
    appendSlabSolidFillFaces(positions, indices, corners);
  }

  if (positions.length === 0) return null;
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

function buildAxialSliceStackWireframeBuffers(
  C: number[],
  u0: number[],
  u1: number[],
  nHat: number[],
  h0: number,
  h1: number,
  numSlices: number,
  thicknessMm: number,
  gapMm: number,
  lineWidthMm: number,
  minB: number[],
  maxB: number[],
): { positions: Float32Array; indices: Uint32Array } | null {
  const g = sliceStackScaledGeometry(C, nHat, numSlices, thicknessMm, gapMm, minB, maxB);
  if (!g) return null;
  const { N, sp2, hT } = g;

  const positions: number[] = [];
  const indices: number[] = [];

  for (let k = 0; k < N; k++) {
    const t = (k - (N - 1) / 2) * sp2;
    const Ck = vadd(C, vscale(nHat, t));
    appendSlabWireframeTopBottomOnly(positions, indices, Ck, u0, u1, nHat, h0, h1, hT, lineWidthMm);
  }

  if (positions.length === 0) return null;
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

/**
 * Outlined rectangle only: ring between outer FoV and an inset inner rect — no filled interior (hole in the middle).
 * FoVx = 2·h0, FoVy = 2·h1 (mm).
 */
function buildAxialFovOutlineRectangleBuffers(
  C: number[],
  u0: number[],
  u1: number[],
  h0: number,
  h1: number,
  borderWidthMm: number,
): { positions: Float32Array; indices: Uint32Array } | null {
  if (h0 <= 0 || h1 <= 0) return null;
  /** Do not let the ring exceed this fraction of the FoV (also avoids “same thickness” when mm math changes). */
  const maxBw = Math.min(h0, h1) * 0.018;
  const bw = Math.max(1e-4, Math.min(borderWidthMm, maxBw, Math.min(h0, h1) * 0.95));
  const hi0 = h0 - bw;
  const hi1 = h1 - bw;
  if (hi0 <= 1e-4 || hi1 <= 1e-4) return null;

  const P = (a0: number, a1: number) => vadd(C, vadd(vscale(u0, a0), vscale(u1, a1)));

  const positions: number[] = [];
  const indices: number[] = [];

  // Outer corners (half-extents h0, h1)
  const obl = P(-h0, -h1);
  const obr = P(h0, -h1);
  const otr = P(h0, h1);
  const otl = P(-h0, h1);
  // Inner corners (half-extents hi0, hi1)
  const ibl = P(-hi0, -hi1);
  const ibr = P(hi0, -hi1);
  const itr = P(hi0, hi1);
  const itl = P(-hi0, hi1);

  // Bottom, top, left, right bands (no corner overlap); two-sided so culling does not strip the ring.
  appendQuadTwoSided(positions, indices, obl, obr, ibr, ibl);
  appendQuadTwoSided(positions, indices, otl, otr, itr, itl);
  appendQuadTwoSided(positions, indices, obl, ibl, itl, otl);
  appendQuadTwoSided(positions, indices, obr, otr, itr, ibr);

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

export function createFovAxisAlignedBoxMesh(
  gl: WebGL2RenderingContext,
  min: number[],
  max: number[],
  options?: Pick<FovBoxOptions, "rgba255" | "name">,
): NVMesh {
  const x0 = min[0];
  const x1 = max[0];
  const y0 = min[1];
  const y1 = max[1];
  const z0 = min[2];
  const z1 = max[2];

  const pts = new Float32Array([
    x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1,
  ]);

  const tris = new Uint32Array([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 5, 1, 0, 4, 5, 2, 7, 3, 2, 6, 7, 0, 3, 7, 0, 7, 4, 1, 2, 6, 1, 6, 5,
  ]);

  const rgba = options?.rgba255 ?? [21, 120, 161, 90];
  const name = options?.name ?? "FOV";
  return new NVMesh(pts, tris, name, [...rgba], 1, true, gl);
}

export type NiivueMeshHost = {
  volumes: unknown[];
  gl: WebGL2RenderingContext | null;
  frac2mm: (...args: unknown[]) => unknown;
  addMesh: (m: NVMesh) => void;
  removeMesh: (m: NVMesh) => void;
  drawScene: () => void;
  setSliceMM?: (v: boolean) => void;
  scene: { crosshairPos: number[] };
  opts: { meshThicknessOn2D: number; meshXRay?: number };
  /** Maps shader name to index (e.g. `"Matte"` → 1 in @niivue/niivue 0.39). */
  meshShaderNameToNumber?: (name: string) => number | undefined;
  /** Register a custom mesh fragment shader; returns shader index for `mesh.meshShaderIndex`. */
  setCustomMeshShader?: (fragmentSource: string, name: string) => number;
  /** Cached index for {@link CAMRIE_UNLIT_NEON_FILL_FRAG_PREMUL}. */
  __camrieUnlitNeonFillPremulShaderIndex?: number;
  /** FoV outline + optional slice-stack wireframes (all removed together). */
  __camrieFovBoxMeshes?: NVMesh[];
  __camrieFovSavedNiivueOpts?: { meshThicknessOn2D: number; meshXRay: number } | null;
  __camrieFovUserTransform?: FovUserMeshTransform;
  __camrieFovLastOptions?: FovBoxOptions;
  __camrieFovLastGeometry?: FovMeshGeometrySnapshot;
  __camrieFovDragCleanup?: () => void;
};

/**
 * Second-pass multiplier for mesh on 2D/3D (Niivue draws meshes twice when meshXRay > 0).
 */
const FOV_MESH_XRAY_ALPHA = 0.97;

/**
 * Unlit mesh fragment (same idea as Niivue’s fiber shader): vertex RGB is drawn as-is — required for true neon yellow
 * because built-in Phong/Matte/Toon multiply by lighting and mute #FFFF00 on MRI.
 */
/**
 * Premultiplied RGB + a so blending with `gl.blendFunc(ONE, ONE_MINUS_SRC_ALPHA)` matches Niivue mesh draws.
 * Straight `vec4(rgb, a)` with SRC_ALPHA double-applies alpha and breaks the x-ray pass.
 */
const CAMRIE_UNLIT_NEON_FILL_FRAG_PREMUL = `#version 300 es
precision highp float;
uniform float opacity;
in vec4 vClr;
in vec3 vN;
out vec4 color;
void main() {
  float a = opacity * vClr.a;
  color = vec4(vClr.rgb * a, a);
}
`;

/**
 * Slice-volume fill — low vertex A; final alpha is `uniform_opacity * vClr.a` where `uniform_opacity` is set per draw
 * pass in `NiivuePatcher` as `alpha * fillMesh.opacity` (Niivue upstream ignores `mesh.opacity` in `drawMesh3D`).
 */
const SLICE_VOLUME_FILL_RGBA255: [number, number, number, number] = [255, 255, 0, 55];

/** Default outline / stack wire — neon green (#39FF14) when `rgba255` is omitted. */
const FOV_OUTLINE_DEFAULT_RGBA255: [number, number, number, number] = [57, 255, 20, 255];

/**
 * Default Niivue mesh fragment shaders scale RGB by ambient+diffuse (≈0.85–0.95 of albedo); nudge vertices so
 * on-screen color is closer to the intended swatch.
 */
function boostFovRgb255(rgba: [number, number, number, number], scale: number): [number, number, number, number] {
  const c = (x: number) => Math.min(255, Math.round(x * scale));
  return [c(rgba[0]), c(rgba[1]), c(rgba[2]), rgba[3]];
}

/** Prefer Matte (no specular highlight, slightly higher diffuse than Phong) — reads brighter and more uniform for UI overlays. */
function fovMeshMatteShaderIndex(nv: NiivueMeshHost): number {
  const idx = nv.meshShaderNameToNumber?.("Matte");
  return typeof idx === "number" && idx >= 0 ? idx : 1;
}

function styleFovNvmesh(mesh: NVMesh, nv: NiivueMeshHost): void {
  mesh.meshShaderIndex = fovMeshMatteShaderIndex(nv);
}

/**
 * Fill surfaces only: custom unlit fragment so vertex yellow is not darkened by Niivue’s lit mesh shaders (they mute
 * #FFFF00 badly on dark volumes). Falls back to Matte if `setCustomMeshShader` is unavailable or compilation fails.
 */
function styleFovSliceFillMesh(mesh: NVMesh, nv: NiivueMeshHost): void {
  const host = nv as NiivueMeshHost;
  const cached = host.__camrieUnlitNeonFillPremulShaderIndex;
  if (typeof cached === "number" && cached >= 0) {
    mesh.meshShaderIndex = cached;
    return;
  }
  try {
    if (typeof host.setCustomMeshShader === "function") {
      let idx = host.meshShaderNameToNumber?.("CamrieUnlitNeonFillPremul");
      if (typeof idx !== "number" || idx < 0) {
        idx = host.setCustomMeshShader(CAMRIE_UNLIT_NEON_FILL_FRAG_PREMUL, "CamrieUnlitNeonFillPremul");
      }
      if (typeof idx === "number" && idx >= 0) {
        host.__camrieUnlitNeonFillPremulShaderIndex = idx;
        mesh.meshShaderIndex = idx;
        return;
      }
    }
  } catch {
    /* use Matte */
  }
  mesh.meshShaderIndex = fovMeshMatteShaderIndex(nv);
}

function applyFovNiivueMeshDrawOpts(nv: NiivueMeshHost) {
  if (!nv.__camrieFovSavedNiivueOpts) {
    nv.__camrieFovSavedNiivueOpts = {
      meshThicknessOn2D: nv.opts?.meshThicknessOn2D ?? 0,
      meshXRay: nv.opts?.meshXRay ?? 0,
    };
  }
  nv.opts.meshThicknessOn2D = Number.POSITIVE_INFINITY;
  nv.opts.meshXRay = FOV_MESH_XRAY_ALPHA;
}

function restoreFovNiivueMeshDrawOpts(nv: NiivueMeshHost) {
  const s = nv.__camrieFovSavedNiivueOpts;
  if (s) {
    nv.opts.meshThicknessOn2D = s.meshThicknessOn2D;
    nv.opts.meshXRay = s.meshXRay;
    nv.__camrieFovSavedNiivueOpts = null;
  }
}

function removeFovMeshesOnly(host: NiivueMeshHost): void {
  const list = host.__camrieFovBoxMeshes;
  if (list?.length) {
    for (const m of list) {
      try {
        host.removeMesh(m);
      } catch {
        /* ignore */
      }
    }
  }
  host.__camrieFovBoxMeshes = [];
}

const DEFAULT_FOV_USER_TRANSFORM: FovUserMeshTransform = {
  offsetMm: [0, 0, 0],
};

/** Device pixels → LR / AP angulation degrees (Alt+Ctrl+drag), matched to Setup text field convention. */
const FOV_INTERACTIVE_DEG_PER_PIXEL_LR = 0.065;
const FOV_INTERACTIVE_DEG_PER_PIXEL_AP = 0.065;
/** Hold Shift while dragging for smaller steps (translate mm and angulation °). */
const FOV_INTERACTIVE_FINE_SCALE = 0.22;

function ensureFovUserTransform(host: NiivueMeshHost): FovUserMeshTransform {
  if (!host.__camrieFovUserTransform) {
    host.__camrieFovUserTransform = {
      offsetMm: [...DEFAULT_FOV_USER_TRANSFORM.offsetMm] as [number, number, number],
    };
  }
  return host.__camrieFovUserTransform;
}

/**
 * Build outline + optional slice-stack meshes; does not register listeners or call `removeFovBoundingBoxMesh`.
 * Caller must apply {@link applyFovNiivueMeshDrawOpts} before adding meshes.
 */
function createAxialFovMeshList(
  nv: NiivueMeshHost,
  gl: WebGL2RenderingContext,
  options: FovBoxOptions,
  C: number[],
  u0: number[],
  u1: number[],
  nHat: number[],
  h0: number,
  h1: number,
  min: number[],
  max: number[],
): NVMesh[] | null {
  const mmToWorld = getMmToNiivueWorldScale(min, max);
  const borderWorld = Math.min(
    0.0065 * mmToWorld,
    Math.max(0.002 * mmToWorld, Math.min(h0, h1) * 0.00012),
  );

  let buf = buildAxialFovOutlineRectangleBuffers(C, u0, u1, h0, h1, borderWorld);
  if (!buf) {
    const fallbackBw = Math.min(0.0055 * mmToWorld, Math.max(0.002 * mmToWorld, Math.min(h0, h1) * 0.0001));
    buf = buildAxialFovOutlineRectangleBuffers(C, u0, u1, h0, h1, fallbackBw);
  }
  if (!buf) return null;

  const rgba = boostFovRgb255(options?.rgba255 ?? FOV_OUTLINE_DEFAULT_RGBA255, 1.1);
  const name = options?.name ?? "Axial FOV";
  const op = options?.opacity ?? 1;
  const mesh = new NVMesh(buf.positions, buf.indices, name, [...rgba], 1, true, gl);
  mesh.opacity = Math.min(1, Math.max(0, op));
  styleFovNvmesh(mesh, nv);

  const meshes: NVMesh[] = [mesh];

  const st = options?.axialSliceStack;
  if (nHat && isValidAxialSliceStack(st)) {
    const stackLw = Math.min(
      0.0075 * mmToWorld,
      Math.max(0.0025 * mmToWorld, Math.min(h0, h1) * 0.00014),
    );
    const stackFillBuf = buildAxialSliceStackSolidFillBuffers(
      C,
      u0,
      u1,
      nHat,
      h0,
      h1,
      st!.numSlices,
      st!.sliceThicknessMm,
      st!.sliceGapMm,
      min,
      max,
    );
    if (stackFillBuf) {
      const fillRgba = SLICE_VOLUME_FILL_RGBA255;
      const fillMesh = new NVMesh(
        stackFillBuf.positions,
        stackFillBuf.indices,
        `${name} slice volume`,
        [...fillRgba],
        1,
        true,
        gl,
      );
      fillMesh.opacity = Math.max(0, 0.22 * op);
      styleFovSliceFillMesh(fillMesh, nv);
      const scale2d =
        options?.sliceFillOpacityScale2D !== undefined
          ? Math.min(1, Math.max(0, options.sliceFillOpacityScale2D))
          : DEFAULT_SLICE_FILL_OPACITY_SCALE_2D;
      const byView = mergeSliceFillOpacityByView(
        options?.sliceFillOpacityByView,
        options?.imagePrescription?.orientation,
      );
      const fillTagged = fillMesh as NVMesh & {
        __camrieFovSliceFillMesh?: boolean;
        __camrieSliceFillOpacityScale2D?: number;
        __camrieSliceFillOpacityByView?: {
          axial: number;
          coronal: number;
          sagittal: number;
          view3d: number;
        };
      };
      fillTagged.__camrieFovSliceFillMesh = true;
      fillTagged.__camrieSliceFillOpacityScale2D = scale2d;
      fillTagged.__camrieSliceFillOpacityByView = byView;
      meshes.push(fillMesh);
    }
    const stackBuf = buildAxialSliceStackWireframeBuffers(
      C,
      u0,
      u1,
      nHat,
      h0,
      h1,
      st!.numSlices,
      st!.sliceThicknessMm,
      st!.sliceGapMm,
      stackLw,
      min,
      max,
    );
    if (stackBuf) {
      const stackMesh = new NVMesh(
        stackBuf.positions,
        stackBuf.indices,
        `${name} slice stack`,
        [...rgba],
        1,
        true,
        gl,
      );
      stackMesh.opacity = Math.min(1, Math.max(0, op));
      styleFovNvmesh(stackMesh, nv);
      meshes.push(stackMesh);
    }
  }

  return meshes;
}

function computeAxialFovPlacement(
  nv: NiivueMeshHost,
  options: FovBoxOptions,
  ut: FovUserMeshTransform,
  min: number[],
  max: number[],
): {
  C: number[];
  u0: number[];
  u1: number[];
  nHat: number[];
  h0: number;
  h1: number;
} | null {
  if (!isValidAxialFovMm(options.axialFovMm)) return null;
  const af = options.axialFovMm!;
  const unitScale = getMmToNiivueWorldScale(min, max);
  const Ciso = volumeIsocenterMm(nv);
  const offsetNative =
    options.sliceOffsetWorldMm !== undefined
      ? mmVecToNiivueNative([...options.sliceOffsetWorldMm], min, max)
      : [...ut.offsetMm];
  const C = vadd(Ciso, offsetNative);
  const prescribed = options.imagePrescription
    ? imageBasisFromOrientationAngulation(
        options.imagePrescription.orientation,
        options.imagePrescription.angulationLRdeg ?? 0,
        options.imagePrescription.angulationAPdeg ?? 0,
        options.imagePrescription.angulationZDeg ?? 0,
      )
    : volumeImageBasisMm(nv);
  let u0 = [...prescribed.row];
  let u1 = [...prescribed.col];
  const nCross = cross(u0, u1);
  let nHat = vlen(nCross) > 1e-12 ? vnorm(nCross) : throughPlaneAxisMm(nv);
  if (!nHat) return null;
  const h0 = (af.fovXMm / 2) * unitScale;
  const h1 = (af.fovYMm / 2) * unitScale;
  return { C, u0, u1, nHat, h0, h1 };
}

/** Rebuild axial FoV meshes from {@link NiivueMeshHost.__camrieFovLastOptions} and user transform (for drag). */
export function rebuildFovBoundingBoxMeshFromUserTransform(nv: any): void {
  const host = nv as NiivueMeshHost;
  const opts = host.__camrieFovLastOptions;
  if (!opts || !nv.gl || !nv.volumes[0] || !isValidAxialFovMm(opts.axialFovMm)) return;
  const ut = ensureFovUserTransform(host);
  const { min, max } = volumeWorldAabbMm(nv);
  const place = computeAxialFovPlacement(host, opts, ut, min, max);
  if (!place) return;
  const { C, u0, u1, nHat, h0, h1 } = place;
  removeFovMeshesOnly(host);
  const meshes = createAxialFovMeshList(host, nv.gl, opts, C, u0, u1, nHat, h0, h1, min, max);
  if (!meshes?.length) return;
  for (const m of meshes) host.addMesh(m);
  host.__camrieFovBoxMeshes = meshes;
  const slice = vnorm(cross(u0, u1));
  host.__camrieFovLastGeometry = {
    centerMm: [...C],
    row: [...u0],
    col: [...u1],
    slice: [...slice],
    halfExtentXMm: h0,
    halfExtentYMm: h1,
  };
  host.drawScene();
}

function installFovMeshDragHandlers(nv: any, options: FovBoxOptions): void {
  const host = nv as NiivueMeshHost;
  host.__camrieFovDragCleanup?.();
  if (!options.fovInteractive?.enabled || !nv.canvas) return;

  const canvas = nv.canvas as HTMLCanvasElement;
  let mode: "translate" | "angulation" | null = null;
  let lastX = 0;
  let lastY = 0;

  /** Same as Niivue `mouseClick`: CSS pixels relative to canvas, then × `uiData.dpr`. Do not extract nv methods — `this` must stay bound. */
  const toDevicePx = (e: PointerEvent): [number, number] | null => {
    const canvasEl = nv.canvas as HTMLElement;
    const rect = canvasEl.getBoundingClientRect();
    const xCss = e.clientX - rect.left;
    const yCss = e.clientY - rect.top;
    const dpr =
      nv.uiData?.dpr ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1);
    if (!Number.isFinite(dpr) || dpr <= 0) return null;
    return [xCss * dpr, yCss * dpr];
  };

  const onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const altFree = options.fovInteractive?.altFree;
    if (!altFree && !e.altKey) return;
    const px = toDevicePx(e);
    if (!px) return;
    e.preventDefault();
    e.stopPropagation();
    if (altFree) {
      // Mode is fixed by the lock flags: translate-only or angulation-only.
      mode = options.fovInteractive?.lockTranslate ? "angulation" : "translate";
    } else {
      mode = e.ctrlKey || e.metaKey ? "angulation" : "translate";
    }
    lastX = px[0];
    lastY = px[1];
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!mode) return;
    const px = toDevicePx(e);
    if (!px) return;
    e.preventDefault();
    e.stopPropagation();
    const ut = ensureFovUserTransform(host);
    const fine = e.shiftKey ? FOV_INTERACTIVE_FINE_SCALE : 1;
    if (mode === "translate") {
      if (options.fovInteractive?.lockTranslate) {
        lastX = px[0];
        lastY = px[1];
        return;
      }
      // Call on `nv` — same `this`-binding issue as Niivue mouse helpers if extracted to a bare function.
      const endMM = nv.screenXY2mm(px[0], px[1]) as number[];
      const startMM = nv.screenXY2mm(lastX, lastY, endMM[3]) as number[];
      if (!Number.isFinite(endMM[0]) || !Number.isFinite(startMM[0])) {
        lastX = px[0];
        lastY = px[1];
        return;
      }
      const d0 = (endMM[0] - startMM[0]) * fine;
      const d1 = (endMM[1] - startMM[1]) * fine;
      const d2 = (endMM[2] - startMM[2]) * fine;
      const { min, max } = volumeWorldAabbMm(nv);
      const op = host.__camrieFovLastOptions;
      if (!op) {
        lastX = px[0];
        lastY = px[1];
        return;
      }
      const curMm: [number, number, number] =
        op.sliceOffsetWorldMm !== undefined
          ? [...op.sliceOffsetWorldMm]
          : (niivueWorldToMm(ut.offsetMm, min, max) as [number, number, number]);
      const curNative = mmVecToNiivueNative(curMm, min, max);
      const newNative = [curNative[0] + d0, curNative[1] + d1, curNative[2] + d2];
      const newMm = niivueWorldToMm(newNative, min, max) as [number, number, number];
      ut.offsetMm[0] = 0;
      ut.offsetMm[1] = 0;
      ut.offsetMm[2] = 0;
      host.__camrieFovLastOptions = {
        ...op,
        sliceOffsetWorldMm: newMm,
      };
      options.fovInteractive?.onSliceOffsetMmChange?.(newMm);
      lastX = px[0];
      lastY = px[1];
      rebuildFovBoundingBoxMeshFromUserTransform(nv);
    } else {
      const op = host.__camrieFovLastOptions;
      if (!op?.imagePrescription) {
        lastX = px[0];
        lastY = px[1];
        return;
      }
      const dx = px[0] - lastX;
      const dy = px[1] - lastY;
      lastX = px[0];
      lastY = px[1];
      /** 2D in (LR, AP): any screen direction maps to a mix of both; diagonal changes both together. */
      let dLR = dx * FOV_INTERACTIVE_DEG_PER_PIXEL_LR * fine;
      let dAP = -dy * FOV_INTERACTIVE_DEG_PER_PIXEL_AP * fine;
      if (options.fovInteractive?.lockAngulationLR) dLR = 0;
      if (options.fovInteractive?.lockAngulationAP) dAP = 0;
      const lr = Math.max(-89.5, Math.min(89.5, (op.imagePrescription.angulationLRdeg ?? 0) + dLR));
      const ap = Math.max(-89.5, Math.min(89.5, (op.imagePrescription.angulationAPdeg ?? 0) + dAP));
      host.__camrieFovLastOptions = {
        ...op,
        imagePrescription: {
          ...op.imagePrescription,
          angulationLRdeg: lr,
          angulationAPdeg: ap,
        },
      };
      options.fovInteractive?.onAngulationSetDeg?.(lr, ap);
      rebuildFovBoundingBoxMeshFromUserTransform(nv);
    }
  };

  const endDrag = (e: PointerEvent): void => {
    if (!mode) return;
    e.preventDefault();
    e.stopPropagation();
    mode = null;
    try {
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown, true);
  canvas.addEventListener("pointermove", onPointerMove, true);
  canvas.addEventListener("pointerup", endDrag, true);
  canvas.addEventListener("pointercancel", endDrag, true);

  host.__camrieFovDragCleanup = () => {
    canvas.removeEventListener("pointerdown", onPointerDown, true);
    canvas.removeEventListener("pointermove", onPointerMove, true);
    canvas.removeEventListener("pointerup", endDrag, true);
    canvas.removeEventListener("pointercancel", endDrag, true);
    host.__camrieFovDragCleanup = undefined;
  };
}

/**
 * Debug / tooling snapshot of the live FoV mesh vs the volume.
 *
 * - **Positions** (`isocenterMm`, `centerMm`, `userTransform.offsetMm`, `halfExtentsMm`) are converted to
 *   **physical millimetres** in the same world frame as Niivue’s `frac2mm` output (native units normalized to mm).
 * - **`axialFovMm`** is copied from the attach options — same user-entered FoV as the Setup form (not clamped).
 * - **`halfExtentsMm`** are the **rendered** half-extents (equal to `axialFovMm/2` in world scale; the overlay now
 *   matches the prescribed FoV and may extend outside the volume). For sequence JSON, use `SequenceGeometryJson.fov_mm` /
 *   `slice` from {@link buildSequenceGeometryJson} (form inputs), not these half-extents.
 */
export function getFovMeshAffineSnapshot(nv: any): {
  isocenterMm: number[];
  userTransform: FovUserMeshTransform;
  centerMm: number[];
  row: number[];
  col: number[];
  slice: number[];
  halfExtentsMm: { x: number; y: number };
  axialFovMm?: AxialFovMm;
  imagePrescription?: FovImagePrescription;
} | null {
  const host = nv as NiivueMeshHost;
  const geom = host.__camrieFovLastGeometry;
  const opts = host.__camrieFovLastOptions;
  if (!geom || !opts) return null;
  const ut = host.__camrieFovUserTransform ?? DEFAULT_FOV_USER_TRANSFORM;
  const { min, max } = volumeWorldAabbMm(nv);
  const inv = 1 / getMmToNiivueWorldScale(min, max);
  const offsetMmPhysical: [number, number, number] =
    opts.sliceOffsetWorldMm !== undefined
      ? [...opts.sliceOffsetWorldMm]
      : ([ut.offsetMm[0] * inv, ut.offsetMm[1] * inv, ut.offsetMm[2] * inv] as [number, number, number]);
  return {
    isocenterMm: niivueWorldToMm(volumeIsocenterMm(nv), min, max),
    userTransform: {
      offsetMm: offsetMmPhysical,
    },
    centerMm: niivueWorldToMm(geom.centerMm, min, max),
    row: [...geom.row],
    col: [...geom.col],
    slice: [...geom.slice],
    halfExtentsMm: { x: geom.halfExtentXMm * inv, y: geom.halfExtentYMm * inv },
    axialFovMm: opts.axialFovMm,
    imagePrescription: opts.imagePrescription,
  };
}

/**
 * Slice group center in **physical millimetres** for {@link buildSequenceGeometryJson} (`isocenter_mm` and affine `t`).
 * Prefers the live mesh center when {@link getFovMeshAffineSnapshot} has geometry (matches clamped overlay);
 * otherwise volume isocenter plus drag offset (same native→mm normalization).
 */
export function getSliceCenterMmForGeometryExport(nv: any): [number, number, number] | null {
  try {
    if (!nv?.volumes?.[0]?.frac2mm) return null;
    const snap = getFovMeshAffineSnapshot(nv);
    if (snap) {
      return [snap.centerMm[0], snap.centerMm[1], snap.centerMm[2]];
    }
    const host = nv as NiivueMeshHost;
    const { min, max } = volumeWorldAabbMm(nv);
    const volIso = volumeIsocenterMm(nv);
    const opts = host.__camrieFovLastOptions;
    const ut = host.__camrieFovUserTransform ?? DEFAULT_FOV_USER_TRANSFORM;
    const offsetNative =
      opts?.sliceOffsetWorldMm !== undefined
        ? mmVecToNiivueNative([...opts.sliceOffsetWorldMm], min, max)
        : [ut.offsetMm[0], ut.offsetMm[1], ut.offsetMm[2]];
    const C = [volIso[0] + offsetNative[0], volIso[1] + offsetNative[1], volIso[2] + offsetNative[2]];
    return niivueWorldToMm(C, min, max) as [number, number, number];
  } catch {
    return null;
  }
}

/** Reset user drag offset/twist (next rebuild uses isocenter / zero twist). */
export function resetFovUserMeshTransform(nv: any): void {
  const host = nv as NiivueMeshHost;
  host.__camrieFovUserTransform = {
    offsetMm: [0, 0, 0],
  };
}

/** Clear Alt+drag translation and redraw FoV meshes when axial FoV options are cached (overlay was attached). */
export function resetFovSliceTranslation(nv: any): void {
  resetFovUserMeshTransform(nv);
  const host = nv as NiivueMeshHost;
  const op = host.__camrieFovLastOptions;
  if (op) {
    host.__camrieFovLastOptions = { ...op, sliceOffsetWorldMm: [0, 0, 0] };
  }
  rebuildFovBoundingBoxMeshFromUserTransform(nv);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Niivue instance typing uses gl-matrix vec3/vec4
export function removeFovBoundingBoxMesh(nv: any, opts?: { clearUserTransform?: boolean }) {
  const host = nv as NiivueMeshHost;
  host.__camrieFovDragCleanup?.();
  host.__camrieFovDragCleanup = undefined;
  restoreFovNiivueMeshDrawOpts(host);
  removeFovMeshesOnly(host);
  host.__camrieFovLastGeometry = undefined;
  host.__camrieFovLastOptions = undefined;
  if (opts?.clearUserTransform) {
    host.__camrieFovUserTransform = undefined;
  }
}

/**
 * Axial FoV ribbon at volume isocenter in the volume i–j plane, or legacy AABB box when axial FoV is not provided.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Niivue instance typing uses gl-matrix vec3/vec4
export function attachFovBoundingBoxMesh(nv: any, options?: FovBoxOptions) {
  removeFovBoundingBoxMesh(nv);
  if (!nv.gl || !nv.volumes[0]) return;
  const gl = nv.gl;

  const host = nv as NiivueMeshHost;
  const { min, max } = volumeWorldAabbMm(nv);

  if (isValidAxialFovMm(options?.axialFovMm) && options) {
    if (options.preserveFovUserTransform === false) {
      host.__camrieFovUserTransform = undefined;
    }
    const ut = ensureFovUserTransform(host);
    const place = computeAxialFovPlacement(host, options, ut, min, max);
    if (!place) return;

    applyFovNiivueMeshDrawOpts(host);

    const { C, u0, u1, nHat, h0, h1 } = place;
    const meshes = createAxialFovMeshList(host, gl, options, C, u0, u1, nHat, h0, h1, min, max);
    if (!meshes?.length) return;

    for (const m of meshes) host.addMesh(m);
    host.__camrieFovBoxMeshes = meshes;
    const slice = vnorm(cross(u0, u1));
    host.__camrieFovLastOptions = options;
    host.__camrieFovLastGeometry = {
      centerMm: [...C],
      row: [...u0],
      col: [...u1],
      slice: [...slice],
      halfExtentXMm: h0,
      halfExtentYMm: h1,
    };
    installFovMeshDragHandlers(nv, options);
    host.drawScene();
    return;
  }

  const scale = clampFovBoxScale(options?.scale);
  const cx = (min[0] + max[0]) / 2;
  const cy = (min[1] + max[1]) / 2;
  const cz = (min[2] + max[2]) / 2;
  const hx = ((max[0] - min[0]) / 2) * scale;
  const hy = ((max[1] - min[1]) / 2) * scale;
  const hz = ((max[2] - min[2]) / 2) * scale;

  const mn = [cx - hx, cy - hy, cz - hz];
  const mx = [cx + hx, cy + hy, cz + hz];

  applyFovNiivueMeshDrawOpts(host);

  const mesh = createFovAxisAlignedBoxMesh(gl, mn, mx, {
    rgba255: options?.rgba255
      ? boostFovRgb255(options.rgba255, 1.08)
      : boostFovRgb255([21, 120, 161, 90], 1.08),
    name: options?.name,
  });
  const op = options?.opacity ?? 0.4;
  mesh.opacity = Math.min(1, Math.max(0.05, op));
  styleFovNvmesh(mesh, host);

  host.addMesh(mesh);
  host.__camrieFovBoxMeshes = [mesh];
  host.drawScene();
}
