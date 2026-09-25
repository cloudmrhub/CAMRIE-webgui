/**
 * Frontend Gmsh (.msh) → VTK legacy PolyData converter.
 *
 * Extracts only triangular surface elements (Gmsh element type 2).
 * Supports Gmsh ASCII v2.2 and v4.x file formats.
 *
 * After conversion a blob URL is returned so Niivue's NVMesh.loadFromUrl
 * can consume it directly — no server round-trip needed.
 *
 * Conversion timing is printed to the console so you can assess whether
 * the frontend approach is viable before committing to a backend change.
 */

const GMSH_TRI_ELEMENT_TYPE = 2;

interface RawMesh {
  /** Flat [x0,y0,z0, x1,y1,z1, …] */
  coords: number[];
  /** Flat 0-based triangle indices [a0,b0,c0, a1,b1,c1, …] */
  tris: number[];
}

// ---------------------------------------------------------------------------
// Gmsh v2.2 ASCII parser
// ---------------------------------------------------------------------------
function parseGmshV2(lines: string[]): RawMesh {
  const nodesIdx = lines.findIndex((l) => l.trim() === "$Nodes");
  if (nodesIdx < 0) throw new Error("Gmsh v2: missing $Nodes section");

  const nodeCount = parseInt(lines[nodesIdx + 1], 10);
  if (!Number.isFinite(nodeCount)) throw new Error("Gmsh v2: invalid node count");

  // gmsh 1-based tag → 0-based position in coords array
  const tagToIdx = new Map<number, number>();
  const coords: number[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const parts = lines[nodesIdx + 2 + i].trim().split(/\s+/);
    const tag = parseInt(parts[0], 10);
    tagToIdx.set(tag, i);
    coords.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
  }

  const elemsIdx = lines.findIndex((l) => l.trim() === "$Elements");
  if (elemsIdx < 0) throw new Error("Gmsh v2: missing $Elements section");

  const elemCount = parseInt(lines[elemsIdx + 1], 10);
  const tris: number[] = [];

  for (let i = 0; i < elemCount; i++) {
    const parts = lines[elemsIdx + 2 + i].trim().split(/\s+/);
    if (parseInt(parts[1], 10) !== GMSH_TRI_ELEMENT_TYPE) continue;
    const ntags = parseInt(parts[2], 10);
    const base = 3 + ntags;
    const a = tagToIdx.get(parseInt(parts[base], 10));
    const b = tagToIdx.get(parseInt(parts[base + 1], 10));
    const c = tagToIdx.get(parseInt(parts[base + 2], 10));
    if (a !== undefined && b !== undefined && c !== undefined) tris.push(a, b, c);
  }

  return { coords, tris };
}

// ---------------------------------------------------------------------------
// Gmsh v4.x ASCII parser
// ---------------------------------------------------------------------------
function parseGmshV4(lines: string[]): RawMesh {
  const nodesIdx = lines.findIndex((l) => l.trim() === "$Nodes");
  if (nodesIdx < 0) throw new Error("Gmsh v4: missing $Nodes section");

  // Header: numEntityBlocks  numNodes  minTag  maxTag
  const nodeHeader = lines[nodesIdx + 1].trim().split(/\s+/);
  const numNodeBlocks = parseInt(nodeHeader[0], 10);

  const tagToIdx = new Map<number, number>();
  const coords: number[] = [];
  let cursor = nodesIdx + 2;

  for (let b = 0; b < numNodeBlocks; b++) {
    // block header: entityDim  entityTag  parametric  numNodesInBlock
    const bh = lines[cursor].trim().split(/\s+/);
    const numInBlock = parseInt(bh[3], 10);
    cursor++;
    // node tags (one per line)
    const blockTags: number[] = [];
    for (let n = 0; n < numInBlock; n++) {
      blockTags.push(parseInt(lines[cursor + n].trim(), 10));
    }
    cursor += numInBlock;
    // coordinates (one node per line)
    for (let n = 0; n < numInBlock; n++) {
      const idx = coords.length / 3;
      tagToIdx.set(blockTags[n], idx);
      const parts = lines[cursor + n].trim().split(/\s+/);
      coords.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
    }
    cursor += numInBlock;
  }

  const elemsIdx = lines.findIndex((l) => l.trim() === "$Elements");
  if (elemsIdx < 0) throw new Error("Gmsh v4: missing $Elements section");

  // Header: numEntityBlocks  numElements  minTag  maxTag
  const elemHeader = lines[elemsIdx + 1].trim().split(/\s+/);
  const numElemBlocks = parseInt(elemHeader[0], 10);

  cursor = elemsIdx + 2;
  const tris: number[] = [];

  for (let b = 0; b < numElemBlocks; b++) {
    // block header: entityDim  entityTag  elementType  numElementsInBlock
    const bh = lines[cursor].trim().split(/\s+/);
    const elemType = parseInt(bh[2], 10);
    const numElems = parseInt(bh[3], 10);
    cursor++;
    for (let e = 0; e < numElems; e++) {
      const parts = lines[cursor + e].trim().split(/\s+/);
      if (elemType === GMSH_TRI_ELEMENT_TYPE) {
        // parts: elemTag  n1  n2  n3
        const a = tagToIdx.get(parseInt(parts[1], 10));
        const b2 = tagToIdx.get(parseInt(parts[2], 10));
        const c = tagToIdx.get(parseInt(parts[3], 10));
        if (a !== undefined && b2 !== undefined && c !== undefined) tris.push(a, b2, c);
      }
    }
    cursor += numElems;
  }

  return { coords, tris };
}

// ---------------------------------------------------------------------------
// VTK legacy ASCII PolyData writer
// ---------------------------------------------------------------------------
function meshToVtkPolydata(mesh: RawMesh, title: string): string {
  const nPts = mesh.coords.length / 3;
  const nTris = mesh.tris.length / 3;

  const parts: string[] = [
    "# vtk DataFile Version 3.0",
    title.slice(0, 255),
    "ASCII",
    "DATASET POLYDATA",
    `POINTS ${nPts} float`,
  ];

  for (let i = 0; i < nPts; i++) {
    parts.push(
      `${mesh.coords[i * 3]} ${mesh.coords[i * 3 + 1]} ${mesh.coords[i * 3 + 2]}`,
    );
  }

  // VTK POLYGONS: total connectivity = nTris * (1 count + 3 indices) = nTris * 4
  parts.push(`POLYGONS ${nTris} ${nTris * 4}`);
  for (let i = 0; i < nTris; i++) {
    parts.push(
      `3 ${mesh.tris[i * 3]} ${mesh.tris[i * 3 + 1]} ${mesh.tris[i * 3 + 2]}`,
    );
  }

  return parts.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse Gmsh ASCII text (v2.2 or v4.x) and produce a VTK legacy PolyData string.
 * Only triangular elements are extracted.
 */
export function gmshTextToVtk(text: string, name = "mesh"): string {
  const versionMatch = text.match(/\$MeshFormat\s*\r?\n([\d.]+)/);
  if (!versionMatch) {
    throw new Error("Not a valid Gmsh ASCII .msh file (no $MeshFormat section)");
  }
  const version = parseFloat(versionMatch[1]);
  const lines = text.split(/\r?\n/);
  const mesh = version >= 4 ? parseGmshV4(lines) : parseGmshV2(lines);

  if (mesh.tris.length === 0) {
    throw new Error(
      `No triangles found in "${name}". Only surface meshes (Gmsh element type 2) are extracted.`,
    );
  }

  return meshToVtkPolydata(mesh, name);
}

export interface GmshConversionResult {
  name: string;
  blobUrl: string;
  nodeCount: number;
  triangleCount: number;
  fetchMs: number;
  convertMs: number;
  totalMs: number;
}

/**
 * Fetch a Gmsh .msh file from a signed URL, convert it to VTK PolyData in the
 * browser, and return an object URL that Niivue's NVMesh.loadFromUrl can consume.
 *
 * Call URL.revokeObjectURL(result.blobUrl) when the mesh is no longer needed.
 */
export async function gmshUrlToVtkBlobUrl(
  name: string,
  url: string,
): Promise<GmshConversionResult> {
  const wallStart = performance.now();

  const fetchStart = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed for "${name}": HTTP ${res.status}`);
  const text = await res.text();
  const fetchMs = performance.now() - fetchStart;

  const convertStart = performance.now();
  const vtk = gmshTextToVtk(text, name);
  const convertMs = performance.now() - convertStart;

  const blob = new Blob([vtk], { type: "text/plain" });
  const blobUrl = URL.createObjectURL(blob);

  const nodeMatch = vtk.match(/^POINTS (\d+)/m);
  const triMatch = vtk.match(/^POLYGONS (\d+)/m);
  const nodeCount = nodeMatch ? parseInt(nodeMatch[1], 10) : 0;
  const triangleCount = triMatch ? parseInt(triMatch[1], 10) : 0;
  const totalMs = performance.now() - wallStart;

  console.log(
    `[gmsh→vtk] "${name}" — nodes: ${nodeCount}, triangles: ${triangleCount} | ` +
    `fetch: ${fetchMs.toFixed(0)} ms  parse+write: ${convertMs.toFixed(0)} ms  total: ${totalMs.toFixed(0)} ms`,
  );

  return { name, blobUrl, nodeCount, triangleCount, fetchMs, convertMs, totalMs };
}

/**
 * Convert multiple Gmsh entries (name → signedUrl) to VTK blob URLs in parallel.
 * Returns a Record<name, vtkBlobUrl> for all successful conversions.
 * Per-entry failures are logged and skipped — they do not throw.
 *
 * Print a summary timing report to the console to assess frontend feasibility.
 */
export async function convertGmshEntries(
  gmshMap: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = Object.entries(gmshMap);
  if (entries.length === 0) return {};

  console.group(
    `[gmsh→vtk] Starting frontend conversion of ${entries.length} Gmsh mesh(es)…`,
  );
  const wallStart = performance.now();

  const settled = await Promise.allSettled(
    entries.map(([name, url]) => gmshUrlToVtkBlobUrl(name, url)),
  );

  const out: Record<string, string> = {};
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      out[r.value.name] = r.value.blobUrl;
      ok++;
    } else {
      console.error(`[gmsh→vtk] "${entries[i][0]}" conversion failed:`, r.reason);
      failed++;
    }
  }

  const totalMs = performance.now() - wallStart;
  console.log(
    `[gmsh→vtk] Finished — ${ok} succeeded, ${failed} failed | wall time: ${totalMs.toFixed(0)} ms` +
    (failed > 0 ? " ← consider a backend conversion if failures persist" : ""),
  );
  console.groupEnd();

  return out;
}
