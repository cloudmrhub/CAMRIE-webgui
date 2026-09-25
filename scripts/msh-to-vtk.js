#!/usr/bin/env node
/**
 * Converts a Gmsh ASCII .msh file to VTK legacy PolyData (ASCII).
 * Uses the same parsing logic as src/common/utilities/gmshToVtk.ts.
 *
 * Usage: node scripts/msh-to-vtk.js <path/to/file.msh>
 */

const fs = require('fs');
const path = require('path');

const GMSH_TRI = 2;

function parseGmshV2(lines) {
  const nodesIdx = lines.findIndex(l => l.trim() === '$Nodes');
  if (nodesIdx < 0) throw new Error('Missing $Nodes section');
  const nodeCount = parseInt(lines[nodesIdx + 1], 10);
  const tagToIdx = new Map();
  const coords = [];
  for (let i = 0; i < nodeCount; i++) {
    const p = lines[nodesIdx + 2 + i].trim().split(/\s+/);
    tagToIdx.set(parseInt(p[0], 10), i);
    coords.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]));
  }
  const elemsIdx = lines.findIndex(l => l.trim() === '$Elements');
  if (elemsIdx < 0) throw new Error('Missing $Elements section');
  const elemCount = parseInt(lines[elemsIdx + 1], 10);
  const tris = [];
  for (let i = 0; i < elemCount; i++) {
    const p = lines[elemsIdx + 2 + i].trim().split(/\s+/);
    if (parseInt(p[1], 10) !== GMSH_TRI) continue;
    const ntags = parseInt(p[2], 10);
    const base = 3 + ntags;
    const a = tagToIdx.get(parseInt(p[base],     10));
    const b = tagToIdx.get(parseInt(p[base + 1], 10));
    const c = tagToIdx.get(parseInt(p[base + 2], 10));
    if (a !== undefined && b !== undefined && c !== undefined) tris.push(a, b, c);
  }
  return { coords, tris };
}

function parseGmshV4(lines) {
  const nodesIdx = lines.findIndex(l => l.trim() === '$Nodes');
  if (nodesIdx < 0) throw new Error('Missing $Nodes section');
  const nodeHeader = lines[nodesIdx + 1].trim().split(/\s+/);
  const numNodeBlocks = parseInt(nodeHeader[0], 10);
  const tagToIdx = new Map();
  const coords = [];
  let cursor = nodesIdx + 2;
  for (let b = 0; b < numNodeBlocks; b++) {
    const bh = lines[cursor].trim().split(/\s+/);
    const num = parseInt(bh[3], 10);
    cursor++;
    const blockTags = [];
    for (let n = 0; n < num; n++) blockTags.push(parseInt(lines[cursor + n].trim(), 10));
    cursor += num;
    for (let n = 0; n < num; n++) {
      const idx = coords.length / 3;
      tagToIdx.set(blockTags[n], idx);
      const p = lines[cursor + n].trim().split(/\s+/);
      coords.push(parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]));
    }
    cursor += num;
  }
  const elemsIdx = lines.findIndex(l => l.trim() === '$Elements');
  if (elemsIdx < 0) throw new Error('Missing $Elements section');
  const elemHeader = lines[elemsIdx + 1].trim().split(/\s+/);
  const numElemBlocks = parseInt(elemHeader[0], 10);
  cursor = elemsIdx + 2;
  const tris = [];
  for (let b = 0; b < numElemBlocks; b++) {
    const bh = lines[cursor].trim().split(/\s+/);
    const elemType = parseInt(bh[2], 10);
    const numElems  = parseInt(bh[3], 10);
    cursor++;
    for (let e = 0; e < numElems; e++) {
      const p = lines[cursor + e].trim().split(/\s+/);
      if (elemType === GMSH_TRI) {
        const a  = tagToIdx.get(parseInt(p[1], 10));
        const b2 = tagToIdx.get(parseInt(p[2], 10));
        const c  = tagToIdx.get(parseInt(p[3], 10));
        if (a !== undefined && b2 !== undefined && c !== undefined) tris.push(a, b2, c);
      }
    }
    cursor += numElems;
  }
  return { coords, tris };
}

function convertMshToVtk(mshPath) {
  const text = fs.readFileSync(mshPath, 'utf-8');
  const verMatch = text.match(/\$MeshFormat\s*\r?\n([\d.]+)/);
  if (!verMatch) throw new Error('Not a valid Gmsh file (no $MeshFormat)');
  const ver = parseFloat(verMatch[1]);
  const lines = text.split(/\r?\n/);

  const t0 = Date.now();
  const mesh = ver >= 4 ? parseGmshV4(lines) : parseGmshV2(lines);
  const parseMs = Date.now() - t0;

  const nPts  = mesh.coords.length / 3;
  const nTris = mesh.tris.length / 3;
  console.log(`Gmsh v${ver}  |  nodes: ${nPts}  triangles: ${nTris}  |  parse: ${parseMs} ms`);

  if (nTris === 0) throw new Error('No triangles found (only surface mesh type 2 elements are extracted)');

  const parts = [
    '# vtk DataFile Version 3.0',
    path.basename(mshPath, '.msh'),
    'ASCII',
    'DATASET POLYDATA',
    `POINTS ${nPts} float`,
  ];
  for (let i = 0; i < nPts; i++)
    parts.push(`${mesh.coords[i*3]} ${mesh.coords[i*3+1]} ${mesh.coords[i*3+2]}`);
  parts.push(`POLYGONS ${nTris} ${nTris * 4}`);
  for (let i = 0; i < nTris; i++)
    parts.push(`3 ${mesh.tris[i*3]} ${mesh.tris[i*3+1]} ${mesh.tris[i*3+2]}`);

  const vtk = parts.join('\n') + '\n';
  const outPath = mshPath.replace(/\.msh$/i, '.vtk');
  const t1 = Date.now();
  fs.writeFileSync(outPath, vtk);
  console.log(`Write: ${Date.now() - t1} ms  |  total: ${Date.now() - t0} ms`);
  console.log(`Output: ${outPath}`);
  return outPath;
}

const mshFile = process.argv[2];
if (!mshFile) {
  console.error('Usage: node scripts/msh-to-vtk.js <path/to/file.msh>');
  process.exit(1);
}

try {
  convertMshToVtk(path.resolve(mshFile));
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
