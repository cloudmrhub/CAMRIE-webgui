import { NVMesh } from "@niivue/niivue";

/** Upper clamp for FOV box scale (matches Setup slider). Slightly past 1× can cover slice/mesh padding vs strict AABB. */
export const FOV_BOX_SCALE_MAX = 1.1;

/** Lower clamp (matches Setup slider). */
export const FOV_BOX_SCALE_MIN = 0.25;

/** Same scaling applied to the mesh and what the UI should display. */
export function clampFovBoxScale(scale: number | undefined): number {
  const raw = scale === undefined ? 1 : Number(scale);
  const n = Number.isFinite(raw) ? raw : 1;
  return Math.min(FOV_BOX_SCALE_MAX, Math.max(FOV_BOX_SCALE_MIN, n));
}

export type FovBoxOptions = {
  /** Scale extent relative to volume world AABB: 1 = full bounds; lower values inset toward center; above 1 expands past data extent (shell only outside volume). */
  scale?: number;
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
        const p = nv.frac2mm([i, j, k]) as number[] | Float32Array;
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

/** Prescribed-isocenter-style point: center voxel in mm. */
export function volumeIsocenterMm(nv: { frac2mm: (...args: unknown[]) => unknown }): number[] {
  return nv.frac2mm([0.5, 0.5, 0.5]) as number[];
}

/**
 * Axis-aligned box mesh in Niivue slice-mm space.
 * Semi-transparent quads read as a 3D FOV “shell” over multiplanar + 3D views.
 */
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
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 5, 1, 0, 4, 5, 2, 7, 3, 2, 6, 7, 0, 3, 7, 0, 7, 4, 1, 2,
    6, 1, 6, 5,
  ]);

  const rgba = options?.rgba255 ?? [21, 120, 161, 90];
  const name = options?.name ?? "FOV";
  return new NVMesh(pts, tris, name, [...rgba], 1, true, gl);
}

/** Niivue instance shape used for FOV mesh helpers (typed loosely for gl-matrix vec3/vec4). */
export type NiivueMeshHost = {
  volumes: unknown[];
  gl: WebGL2RenderingContext | null;
  frac2mm: (...args: unknown[]) => unknown;
  addMesh: (m: NVMesh) => void;
  removeMesh: (m: NVMesh) => void;
  drawScene: () => void;
  setSliceMM?: (v: boolean) => void;
  __camrieFovBoxMesh?: NVMesh | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Niivue instance typing uses gl-matrix vec3/vec4
export function removeFovBoundingBoxMesh(nv: any) {
  const host = nv as NiivueMeshHost;
  const m = host.__camrieFovBoxMesh;
  if (m) {
    try {
      host.removeMesh(m);
    } catch {
      /* ignore */
    }
    host.__camrieFovBoxMesh = null;
  }
}

/**
 * Replace any prior FOV mesh with one matching the current volume world AABB (center = AABB center).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Niivue instance typing uses gl-matrix vec3/vec4
export function attachFovBoundingBoxMesh(nv: any, options?: FovBoxOptions) {
  removeFovBoundingBoxMesh(nv);
  if (!nv.gl || !nv.volumes[0]) return;

  const { min, max } = volumeWorldAabbMm(nv);
  const scale = clampFovBoxScale(options?.scale);
  const cx = (min[0] + max[0]) / 2;
  const cy = (min[1] + max[1]) / 2;
  const cz = (min[2] + max[2]) / 2;
  const hx = ((max[0] - min[0]) / 2) * scale;
  const hy = ((max[1] - min[1]) / 2) * scale;
  const hz = ((max[2] - min[2]) / 2) * scale;

  const mn = [cx - hx, cy - hy, cz - hz];
  const mx = [cx + hx, cy + hy, cz + hz];

  const host = nv as NiivueMeshHost;
  const mesh = createFovAxisAlignedBoxMesh(host.gl, mn, mx, {
    rgba255: options?.rgba255,
    name: options?.name,
  });
  const op = options?.opacity ?? 0.4;
  mesh.opacity = Math.min(1, Math.max(0.05, op));

  host.addMesh(mesh);
  host.__camrieFovBoxMesh = mesh;
  host.drawScene();
}
