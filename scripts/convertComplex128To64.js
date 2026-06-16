#!/usr/bin/env node
/**
 * Converts complex128 (double-precision complex) NIfTI files to complex64
 * (single-precision) for display in NiiVue. Writes to output path only-
 * the original file is never modified.
 *
 * Usage: node scripts/convertComplex128To64.js <inputPath> <outputPath>
 *
 * Example: node scripts/convertComplex128To64.js input.nii output_complex64.nii
 */

const fs = require('fs');
const path = require('path');
const nifti = require('nifti-reader-js');

const TYPE_COMPLEX128 = 1792;
const TYPE_COMPLEX64 = 32;

function convertComplex128To64(inputPath, outputPath) {
  if (inputPath === outputPath) {
    throw new Error('Input and output paths must differ. Original file is never overwritten.');
  }

  let data = fs.readFileSync(inputPath);
  let arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  );

  if (nifti.isCompressed(arrayBuffer)) {
    arrayBuffer = nifti.decompress(arrayBuffer);
  }

  const header = nifti.readHeader(arrayBuffer);

  if (header.datatypeCode !== TYPE_COMPLEX128) {
    throw new Error(
      `Input is not complex128 (datatype ${TYPE_COMPLEX128}). Got datatype ${header.datatypeCode}. No conversion needed.`
    );
  }

  const image = nifti.readImage(header, arrayBuffer);

  // Simpler approach: new Float32Array(new Float64Array(image))
  // Creates new arrays only; does not modify original buffer
  const float32 = new Float32Array(new Float64Array(image));

  // Update header for complex64
  header.datatypeCode = TYPE_COMPLEX64;
  header.numBitsPerVoxel = 64;

  const newHeaderBuffer = header.toArrayBuffer();
  const combined = new Uint8Array(
    newHeaderBuffer.byteLength + float32.byteLength
  );
  combined.set(new Uint8Array(newHeaderBuffer), 0);
  combined.set(new Uint8Array(float32.buffer), newHeaderBuffer.byteLength);

  fs.writeFileSync(outputPath, combined);
  console.log(`Converted: ${inputPath} -> ${outputPath}`);
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/convertComplex128To64.js <inputPath> <outputPath>');
  process.exit(1);
}

try {
  convertComplex128To64(
    path.resolve(inputPath),
    path.resolve(outputPath)
  );
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
