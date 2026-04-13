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
 * Same convention as Niivue `createOnLocationChange`: slice-mm (`frac2mm` matrix), not `frac2mmOrtho`.
 * Otherwise the FoV drifts from the crosshair when "world space" / isSliceMM toggles differ.
 */
function sliceMmFromFrac(nv: { frac2mm: (...args: unknown[]) => unknown }, frac: number[]): number[] {
  return nv.frac2mm([frac[0], frac[1], frac[2]], 0, true) as number[];
}

/** Multi-slice axial stack: through-plane axis = voxel k̂ (cross of in-plane î,ĵ); slice centers spaced by thickness + gap. */
export type AxialSliceStackMm = {
  numSlices: number;
  sliceThicknessMm: number;
  sliceGapMm: number;
};

export type FovBoxOptions = {
  /** Used only when `axialFovMm` is absent or invalid: scale extent relative to volume world AABB. */
  scale?: number;
  /** When set with positive finite FoV lengths, draws an axial (i–j plane) rectangle at volume isocenter (0.5³ frac), clipped to the volume. */
  axialFovMm?: AxialFovMm;
  /** Wireframe slab boxes for each slice (thickness + gap); same in-plane half-extents as axial FoV after clamp. */
  axialSliceStack?: AxialSliceStackMm;
  /** RGBA 0–255. */
  rgba255?: [number, number, number, number];
  /** Combined opacity 0–1 (in addition to rgba alpha in shader path). */
  opacity?: number;
  name?: string;
};

/** World-space axis-aligned bounds from Niivue `frac2mm` (8 volume corners). */
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

function pointInAabb(p: number[], min: number[], max: number[]): boolean {
  const e = 1e-4;
  return p[0] >= min[0] - e && p[0] <= max[0] + e && p[1] >= min[1] - e && p[1] <= max[1] + e && p[2] >= min[2] - e && p[2] <= max[2] + e;
}

function cornersInside(
  C: number[],
  u0: number[],
  u1: number[],
  h0: number,
  h1: number,
  min: number[],
  max: number[],
): boolean {
  const signs: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [s0, s1] of signs) {
    const p = [C[0] + s0 * h0 * u0[0] + s1 * h1 * u1[0], C[1] + s0 * h0 * u0[1] + s1 * h1 * u1[1], C[2] + s0 * h0 * u0[2] + s1 * h1 * u1[2]];
    if (!pointInAabb(p, min, max)) return false;
  }
  return true;
}

/** Uniformly scale half-extents so all four in-plane corners stay inside the volume AABB (same aspect). */
export function clampHalvesUniformToVolumeAabb(
  C: number[],
  u0: number[],
  u1: number[],
  h0: number,
  h1: number,
  min: number[],
  max: number[],
): { h0: number; h1: number } {
  if (h0 <= 0 || h1 <= 0) return { h0: 0, h1: 0 };
  if (cornersInside(C, u0, u1, h0, h1, min, max)) return { h0, h1 };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const m = (lo + hi) / 2;
    if (cornersInside(C, u0, u1, h0 * m, h1 * m, min, max)) lo = m;
    else hi = m;
  }
  return { h0: h0 * lo, h1: h1 * lo };
}

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

/** Axial slice normal (through-plane / k̂) in mm, orthogonal to î and ĵ. */
function throughPlaneAxisMm(nv: { frac2mm: (...args: unknown[]) => unknown }): number[] | null {
  const { u0, u1 } = volumeInPlaneAxesMm(nv);
  const n = cross(u0, u1);
  if (vlen(n) < 1e-12) return null;
  return vnorm(n);
}

/** Line C + t·n̂ clipped to world AABB (n̂ unit); returns inclusive [lo, hi] in t. */
function lineClipIntervalAgainstAabb(C: number[], nHat: number[], minB: number[], maxB: number[]): { lo: number; hi: number } | null {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = nHat[i];
    if (Math.abs(d) < 1e-14) {
      if (C[i] < minB[i] - 1e-5 || C[i] > maxB[i] + 1e-5) return null;
      continue;
    }
    const inv0 = (minB[i] - C[i]) / d;
    const inv1 = (maxB[i] - C[i]) / d;
    const lo = Math.min(inv0, inv1);
    const hi = Math.max(inv0, inv1);
    t0 = Math.max(t0, lo);
    t1 = Math.min(t1, hi);
  }
  if (t0 > t1 + 1e-9) return null;
  return { lo: t0, hi: t1 };
}

/** Max |t| such that C + t·n̂ stays in box when 0 ∈ [lo,hi]. */
function maxSymmetricHalfSpanAlongLine(lo: number, hi: number): number {
  if (lo <= 0 && hi >= 0) return Math.min(-lo, hi);
  return 0;
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
  const T = Math.max(1e-6, thicknessMm);
  const G = Math.max(0, gapMm);
  const halfStack = (N * T + (N - 1) * G) / 2;

  const iv = lineClipIntervalAgainstAabb(C, nHat, minB, maxB);
  if (!iv) return null;
  const halfAvail = maxSymmetricHalfSpanAlongLine(iv.lo, iv.hi) * 0.98;
  if (halfAvail < 1e-6) return null;

  const scale = halfStack > 1e-9 ? Math.min(1, halfAvail / halfStack) : 1;
  const T2 = T * scale;
  const G2 = G * scale;
  const sp2 = T2 + G2;
  const hT = T2 / 2;
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
  /** Cached index for {@link CAMRIE_UNLIT_NEON_FILL_FRAG}. */
  __camrieUnlitNeonFillShaderIndex?: number;
  /** FoV outline + optional slice-stack wireframes (all removed together). */
  __camrieFovBoxMeshes?: NVMesh[];
  __camrieFovSavedNiivueOpts?: { meshThicknessOn2D: number; meshXRay: number } | null;
};

/** Second-pass alpha for mesh on 2D slices (Niivue draws meshes twice when meshXRay > 0 so lines sit above the slice). */
const FOV_MESH_XRAY_ALPHA = 0.97;

/**
 * Unlit mesh fragment (same idea as Niivue’s fiber shader): vertex RGB is drawn as-is — required for true neon yellow
 * because built-in Phong/Matte/Toon multiply by lighting and mute #FFFF00 on MRI.
 */
const CAMRIE_UNLIT_NEON_FILL_FRAG = `#version 300 es
precision highp float;
uniform float opacity;
in vec4 vClr;
in vec3 vN;
out vec4 color;
void main() {
  color = vec4(vClr.rgb, opacity);
}
`;

/** Slice-volume fill — pure neon yellow; actual screen color comes from unlit shader above. */
const SLICE_VOLUME_FILL_RGBA255: [number, number, number, number] = [255, 255, 0, 255];

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
  const cached = host.__camrieUnlitNeonFillShaderIndex;
  if (typeof cached === "number" && cached >= 0) {
    mesh.meshShaderIndex = cached;
    return;
  }
  try {
    if (typeof host.setCustomMeshShader === "function") {
      let idx = host.meshShaderNameToNumber?.("CamrieUnlitNeonFill");
      if (typeof idx !== "number" || idx < 0) {
        idx = host.setCustomMeshShader(CAMRIE_UNLIT_NEON_FILL_FRAG, "CamrieUnlitNeonFill");
      }
      if (typeof idx === "number" && idx >= 0) {
        host.__camrieUnlitNeonFillShaderIndex = idx;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Niivue instance typing uses gl-matrix vec3/vec4
export function removeFovBoundingBoxMesh(nv: any) {
  const host = nv as NiivueMeshHost;
  restoreFovNiivueMeshDrawOpts(host);
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

  if (isValidAxialFovMm(options?.axialFovMm)) {
    const af = options!.axialFovMm!;
    const C = volumeIsocenterMm(nv);
    const { u0, u1 } = volumeInPlaneAxesMm(nv);
    let h0 = af.fovXMm / 2;
    let h1 = af.fovYMm / 2;
    const clamped = clampHalvesUniformToVolumeAabb(C, u0, u1, h0, h1, min, max);
    h0 = clamped.h0;
    h1 = clamped.h1;

    /**
     * Hollow-ring stroke (mm): distance between inner and outer rect — in-plane “width” of the outline band;
     * keep near hairline so it reads as a line outline, not a filled band.
     */
    const borderMm = Math.min(0.0065, Math.max(0.002, Math.min(h0, h1) * 0.00012));

    let buf = buildAxialFovOutlineRectangleBuffers(C, u0, u1, h0, h1, borderMm);
    if (!buf) {
      const fallbackBw = Math.min(0.0055, Math.max(0.002, Math.min(h0, h1) * 0.0001));
      buf = buildAxialFovOutlineRectangleBuffers(C, u0, u1, h0, h1, fallbackBw);
    }
    if (!buf) return;

    applyFovNiivueMeshDrawOpts(host);

    /** Outline + stack wires — neon green by default (vertex RGB boosted for Niivue mesh shading). */
    const rgba = boostFovRgb255(options?.rgba255 ?? FOV_OUTLINE_DEFAULT_RGBA255, 1.1);
    const name = options?.name ?? "Axial FOV";
    const mesh = new NVMesh(buf.positions, buf.indices, name, [...rgba], 1, true, gl);
    const op = options?.opacity ?? 1;
    mesh.opacity = Math.min(1, Math.max(0.05, op));
    styleFovNvmesh(mesh, host);

    const meshes: NVMesh[] = [mesh];

    const nHat = throughPlaneAxisMm(nv);
    const st = options?.axialSliceStack;
    if (nHat && isValidAxialSliceStack(st)) {
      /** Perpendicular width of each edge ribbon (mm) — lower = slice box edges look like lines, not flat strips. */
      const stackLw = Math.min(0.0075, Math.max(0.0025, Math.min(h0, h1) * 0.00014));
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
        fillMesh.opacity = 1;
        styleFovSliceFillMesh(fillMesh, host);
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
        stackMesh.opacity = Math.min(1, Math.max(0.05, op));
        styleFovNvmesh(stackMesh, host);
        meshes.push(stackMesh);
      }
    }

    for (const m of meshes) host.addMesh(m);
    host.__camrieFovBoxMeshes = meshes;
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
