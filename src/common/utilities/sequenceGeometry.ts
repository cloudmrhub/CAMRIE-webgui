import {
  imageBasisFromOrientationAngulation,
  type FovImagePrescription,
  type FovPlaneOrientation,
} from "./fovBoundingBoxMesh";

/** 4×4 row-major homogeneous transform. */
export type Affine4x4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
];

/**
 * Stored ids for phase/frequency encoding direction pickers (labels vary by slice orientation).
 * For the foot–head axis, `up` / `down` mean **feet → head** / **head → feet** in the picker labels (patient-fixed, head-first; equivalent superior/inferior); ids are unchanged for JSON compatibility.
 */
export type EncodingDirectionId = "left" | "right" | "anterior" | "posterior" | "up" | "down";

export const ENCODING_DIRECTION_OPTIONS: Record<
  FovPlaneOrientation,
  readonly { value: EncodingDirectionId; label: string }[]
> = {
  axial: [
    { value: "left", label: "Right - Left" },
    { value: "right", label: "Left - Right" },
    { value: "posterior", label: "Anterior - Posterior" },
    { value: "anterior", label: "Posterior - Anterior" },
  ],
  sagittal: [
    { value: "posterior", label: "Anterior - Posterior" },
    { value: "anterior", label: "Posterior - Anterior" },
    { value: "down", label: "Head - Feet" },
    { value: "up", label: "Feet - Head" },
  ],
  coronal: [
    { value: "left", label: "Right - Left" },
    { value: "right", label: "Left - Right" },
    { value: "down", label: "Head - Feet" },
    { value: "up", label: "Feet - Head" },
  ],
};

export function clampEncodingDirectionToOrientation(
  orientation: FovPlaneOrientation,
  direction: EncodingDirectionId,
): EncodingDirectionId {
  const opts = ENCODING_DIRECTION_OPTIONS[orientation];
  if (opts.some((o) => o.value === direction)) return direction;
  return opts[0].value;
}

/**
 * In-plane **anatomical axis** (not polarity). Left/right share LR; anterior/posterior share AP;
 * up/down share head–feet (SI). Phase and readout must sit on two **different** of these in the slice.
 */
export type EncodingAnatomicalAxis = "lr" | "ap" | "si";

export const ENCODING_DIRECTION_ANATOMICAL_AXIS: Record<EncodingDirectionId, EncodingAnatomicalAxis> = {
  left: "lr",
  right: "lr",
  anterior: "ap",
  posterior: "ap",
  up: "si",
  down: "si",
};

export function areEncodingDirectionsOnSameAnatomicalAxis(
  a: EncodingDirectionId,
  b: EncodingDirectionId,
): boolean {
  return ENCODING_DIRECTION_ANATOMICAL_AXIS[a] === ENCODING_DIRECTION_ANATOMICAL_AXIS[b];
}

/**
 * Phase and frequency encoding must use **perpendicular in-plane axes** (e.g. LR + AP, not L + R).
 * If the two sit on the same anatomical axis, adjusts {@link options.preferAdjust} (default `frequency`)
 * to the first option that lies on a different axis.
 */
export function resolveOrthogonalEncodingDirections(
  orientation: FovPlaneOrientation,
  phase: EncodingDirectionId,
  frequency: EncodingDirectionId,
  options?: { preferAdjust?: "phase" | "frequency" },
): { phaseEncodingDirection: EncodingDirectionId; frequencyEncodingDirection: EncodingDirectionId } {
  const p = clampEncodingDirectionToOrientation(orientation, phase);
  const f = clampEncodingDirectionToOrientation(orientation, frequency);
  if (!areEncodingDirectionsOnSameAnatomicalAxis(p, f)) {
    return { phaseEncodingDirection: p, frequencyEncodingDirection: f };
  }
  const opts = ENCODING_DIRECTION_OPTIONS[orientation];
  const firstOnDifferentAxisThan = (dir: EncodingDirectionId): EncodingDirectionId => {
    const avoid = ENCODING_DIRECTION_ANATOMICAL_AXIS[dir];
    return (
      opts.find((o) => ENCODING_DIRECTION_ANATOMICAL_AXIS[o.value] !== avoid)?.value ??
      opts.find((o) => o.value !== dir)?.value ??
      opts[1].value
    );
  };
  if (options?.preferAdjust === "phase") {
    return {
      phaseEncodingDirection: firstOnDifferentAxisThan(f),
      frequencyEncodingDirection: f,
    };
  }
  return {
    phaseEncodingDirection: p,
    frequencyEncodingDirection: firstOnDifferentAxisThan(p),
  };
}

/**
 * Geometry for one pulse sequence (JSON export).
 *
 * - **`fov_mm`**, **`matrix`**, **`slice`**: copied from Setup form state (user-facing millimetres and counts).
 *   They are **not** taken from Niivue mesh half-extents (the on-screen box may be clamped to the volume).
 * - **`isocenter_mm`** and **`affine`**: built in **physical millimetres** in the same world frame as Niivue’s
 *   `frac2mm` output after normalizing native units; `isocenter_mm` is the live slice group center when the
 *   viewer is available (see `getSliceCenterMmForGeometryExport`).
 * - **`affine`** maps integer voxel indices to world position in mm; backends should treat it as authoritative
 *   for orientation and spacing; **`ui`** is round-trip metadata for the Setup screen.
 */
export type SequenceGeometryJson = {
  isocenter_mm: [number, number, number] | null;
  /** In-plane field of view [x, y] in mm (from form: pixels × mm/px). */
  fov_mm: [number, number];
  /** Acquisition matrix [Nx, Ny] (from form). */
  matrix: [number, number];
  slice: {
    num_slices: number;
    thickness_mm: number;
    gap_mm: number;
  };
  /**
   * Image index → **world position in millimetres** (patient-fixed frame as Niivue `frac2mm` after mm normalization: +x left, +y posterior, +z superior, head-first).
   * **world** = **affine** × [i, j, k, 1]ᵀ with integer indices i∈[0,Nx−1], j∈[0,Ny−1], k∈[0,Nz−1].
   * Column 0 = readout × (fov_x/Nx), column 1 = phase × (fov_y/Ny), column 2 = slice normal × dz
   * (dz = thickness_mm + gap_mm). Column 3 is chosen so the **center** of the grid maps to `isocenter_mm`
   * (matches FoV overlay center), not voxel (0,0,0).
   */
  affine: Affine4x4;
  /** Setup UI metadata; not authoritative vs `affine` — use for UI / round-trip. */
  ui: {
    orientation: FovPlaneOrientation;
    angulation_lr_deg: number;
    angulation_ap_deg: number;
    /** Z rotation about slice normal after LR/AP (deg). Prefer over deprecated `angulation_slice_deg`. */
    angulation_z_deg?: number;
    /** @deprecated Renamed to {@link SequenceGeometryJson.ui.angulation_z_deg}. */
    angulation_slice_deg?: number;
    /**
     * Offset of the slice group center (central slice of the stack) from **volume isocenter**, mm,
     * in CAMRIE world axes (+x toward left, +y toward posterior, +z toward superior; patient-fixed, head-first).
     */
    slice_offset_mm?: [number, number, number];
    /** @deprecated Renamed to {@link SequenceGeometryJson.ui.slice_offset_mm}. */
    prescription_offset_mm?: [number, number, number];
    /** In-plane anatomical direction for phase-encoded axis (Setup UI; optional for older saves). */
    phase_encoding_direction?: EncodingDirectionId;
    /** In-plane anatomical direction for frequency-encoded axis (readout). */
    frequency_encoding_direction?: EncodingDirectionId;
  };
};

/** Previous on-disk shape (localStorage) — migrated when loading. */
export type LegacySequenceGeometryJson = {
  isocenter_mm: [number, number, number] | null;
  slice_normal: [number, number, number];
  row_direction: [number, number, number];
  column_direction: [number, number, number];
  orientation: FovPlaneOrientation;
  angulation_lr_deg: number;
  angulation_ap_deg: number;
  seq_fov_mm: { fov_x_mm: number; fov_y_mm: number };
  pixel_matrix: {
    num_pixels_x: number;
    num_pixels_y: number;
    resolution_x_mm: number;
    resolution_y_mm: number;
  };
  num_slices: number;
  slice_thickness_mm: number;
  slice_gap_mm: number;
  affine_image_to_world_4x4: Affine4x4;
};

export type SetupGeometryCaptureInput = {
  prescription: FovImagePrescription;
  sequenceFovXMM: number;
  sequenceFovYMM: number;
  fovPixelsX: number;
  fovPixelsY: number;
  fovResXMM: number;
  fovResYMM: number;
  sagittalNumSlices: number;
  sagittalSliceThicknessMm: number;
  sagittalSliceGapMm: number;
  /** Slice group center offset from volume isocenter (mm; +x left, +y posterior, +z superior). */
  sliceOffsetXMM: number;
  sliceOffsetYMM: number;
  sliceOffsetZMM: number;
  isocenterMm: [number, number, number] | null;
  phaseEncodingDirection: EncodingDirectionId;
  frequencyEncodingDirection: EncodingDirectionId;
};

function affine4ScaledFromBasis(
  row: number[],
  col: number[],
  slice: number[],
  dx: number,
  dy: number,
  dz: number,
  t: [number, number, number],
): Affine4x4 {
  return [
    [row[0] * dx, col[0] * dy, slice[0] * dz, t[0]],
    [row[1] * dx, col[1] * dy, slice[1] * dz, t[1]],
    [row[2] * dx, col[2] * dy, slice[2] * dz, t[2]],
    [0, 0, 0, 1],
  ];
}

function vec3Add(a: number[], b: number[]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Sub(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Scale(v: number[], s: number): [number, number, number] {
  return [v[0] * s, v[1] * s, v[2] * s];
}

/** Editable FoV / slice fields stored per protocol sequence id (Setup UI state). */
export type SequenceGeometryFormState = {
  orientation: FovPlaneOrientation;
  angulationLRdeg: number;
  angulationAPdeg: number;
  /** Z rotation about slice normal after LR/AP world tilts (deg). */
  angulationZDeg: number;
  fovPixelsX: number;
  fovPixelsY: number;
  fovResXMM: number;
  fovResYMM: number;
  sagittalNumSlices: number;
  sagittalSliceThicknessMm: number;
  /** Slice gap expressed as a percentage of slice thickness (e.g. 10 = 10%). Converted to mm at export time. */
  sagittalSliceGapPct: number;
  /** Offset of slice group center from volume isocenter (mm; +x toward left, +y toward posterior, +z toward superior; head-first). */
  sliceOffsetXMM: number;
  sliceOffsetYMM: number;
  sliceOffsetZMM: number;
  /**
   * `null` means the user cleared this field due to a conflict with the other encoding axis and
   * must re-select before the geometry can be exported.
   */
  phaseEncodingDirection: EncodingDirectionId | null;
  frequencyEncodingDirection: EncodingDirectionId | null;
};

export const DEFAULT_SEQUENCE_GEOMETRY_FORM: SequenceGeometryFormState = {
  orientation: "axial",
  angulationLRdeg: 0,
  angulationAPdeg: 0,
  angulationZDeg: 0,
  fovPixelsX: 128,
  fovPixelsY: 128,
  fovResXMM: 1,
  fovResYMM: 1,
  sagittalNumSlices: 5,
  sagittalSliceThicknessMm: 2,
  sagittalSliceGapPct: 0,
  sliceOffsetXMM: 0,
  sliceOffsetYMM: 0,
  sliceOffsetZMM: 0,
  phaseEncodingDirection: null,
  frequencyEncodingDirection: null,
};

export function formStateToCaptureInput(
  form: SequenceGeometryFormState,
  isocenterMm: [number, number, number] | null,
): SetupGeometryCaptureInput {
  return {
    prescription: {
      orientation: form.orientation,
      angulationLRdeg: form.angulationLRdeg,
      angulationAPdeg: form.angulationAPdeg,
      angulationZDeg: form.angulationZDeg,
    },
    sequenceFovXMM: Math.max(0, Math.round(form.fovPixelsX) * form.fovResXMM),
    sequenceFovYMM: Math.max(0, Math.round(form.fovPixelsY) * form.fovResYMM),
    fovPixelsX: form.fovPixelsX,
    fovPixelsY: form.fovPixelsY,
    fovResXMM: form.fovResXMM,
    fovResYMM: form.fovResYMM,
    sagittalNumSlices: form.sagittalNumSlices,
    sagittalSliceThicknessMm: form.sagittalSliceThicknessMm,
    sagittalSliceGapMm: Math.max(0, (form.sagittalSliceGapPct / 100) * form.sagittalSliceThicknessMm),
    sliceOffsetXMM: form.sliceOffsetXMM,
    sliceOffsetYMM: form.sliceOffsetYMM,
    sliceOffsetZMM: form.sliceOffsetZMM,
    isocenterMm,
    phaseEncodingDirection: form.phaseEncodingDirection ?? "left",
    frequencyEncodingDirection: form.frequencyEncodingDirection ?? "anterior",
  };
}

function isLegacySequenceGeometry(g: unknown): g is LegacySequenceGeometryJson {
  return (
    g != null &&
    typeof g === "object" &&
    "affine_image_to_world_4x4" in g &&
    "pixel_matrix" in g &&
    !("affine" in g && "fov_mm" in g)
  );
}

/** Restore Setup form state from saved geometry (canonical or legacy). */
export function sequenceGeometryJsonToFormState(
  g: SequenceGeometryJson | LegacySequenceGeometryJson,
): SequenceGeometryFormState {
  if (isLegacySequenceGeometry(g)) {
    return {
      orientation: g.orientation,
      angulationLRdeg: g.angulation_lr_deg,
      angulationAPdeg: g.angulation_ap_deg,
      angulationZDeg: 0,
      fovPixelsX: g.pixel_matrix.num_pixels_x,
      fovPixelsY: g.pixel_matrix.num_pixels_y,
      fovResXMM: g.pixel_matrix.resolution_x_mm,
      fovResYMM: g.pixel_matrix.resolution_y_mm,
      sagittalNumSlices: g.num_slices,
      sagittalSliceThicknessMm: g.slice_thickness_mm,
      sagittalSliceGapPct: g.slice_thickness_mm > 0 ? (g.slice_gap_mm / g.slice_thickness_mm) * 100 : 0,
      sliceOffsetXMM: 0,
      sliceOffsetYMM: 0,
      sliceOffsetZMM: 0,
      phaseEncodingDirection: clampEncodingDirectionToOrientation(g.orientation, "left"),
      frequencyEncodingDirection: clampEncodingDirectionToOrientation(g.orientation, "anterior"),
    };
  }

  const nx = Math.max(1, Math.round(g.matrix[0]));
  const ny = Math.max(1, Math.round(g.matrix[1]));
  const o = g.ui.orientation;
  const phaseIn = g.ui.phase_encoding_direction;
  const freqIn = g.ui.frequency_encoding_direction;
  const off =
    g.ui.slice_offset_mm ??
    g.ui.prescription_offset_mm ??
    ([0, 0, 0] as [number, number, number]);
  return {
    orientation: o,
    angulationLRdeg: g.ui.angulation_lr_deg,
    angulationAPdeg: g.ui.angulation_ap_deg,
    angulationZDeg: g.ui.angulation_z_deg ?? g.ui.angulation_slice_deg ?? 0,
    fovPixelsX: nx,
    fovPixelsY: ny,
    fovResXMM: nx > 0 ? g.fov_mm[0] / nx : 1,
    fovResYMM: ny > 0 ? g.fov_mm[1] / ny : 1,
    sagittalNumSlices: g.slice.num_slices,
    sagittalSliceThicknessMm: g.slice.thickness_mm,
    sagittalSliceGapPct: g.slice.thickness_mm > 0 ? (g.slice.gap_mm / g.slice.thickness_mm) * 100 : 0,
    sliceOffsetXMM: off[0] ?? 0,
    sliceOffsetYMM: off[1] ?? 0,
    sliceOffsetZMM: off[2] ?? 0,
    phaseEncodingDirection: clampEncodingDirectionToOrientation(o, phaseIn ?? "left"),
    frequencyEncodingDirection: clampEncodingDirectionToOrientation(o, freqIn ?? "anterior"),
  };
}

export function buildSequenceGeometryJson(input: SetupGeometryCaptureInput): SequenceGeometryJson {
  const { prescription } = input;
  const basis = imageBasisFromOrientationAngulation(
    prescription.orientation,
    prescription.angulationLRdeg ?? 0,
    prescription.angulationAPdeg ?? 0,
    prescription.angulationZDeg ?? 0,
  );
  const iso: [number, number, number] | null = input.isocenterMm
    ? [input.isocenterMm[0], input.isocenterMm[1], input.isocenterMm[2]]
    : null;
  /** Slice group center in world mm; if no volume, origin-centered grid in world mm. */
  const centerMm: [number, number, number] = input.isocenterMm ?? [0, 0, 0];

  const nx = Math.max(1, Math.round(input.fovPixelsX));
  const ny = Math.max(1, Math.round(input.fovPixelsY));
  const nz = Math.max(1, Math.round(input.sagittalNumSlices));
  const fovX = input.sequenceFovXMM;
  const fovY = input.sequenceFovYMM;
  const dx = fovX / nx;
  const dy = fovY / ny;
  // User slice spacing in mm (same numbers as Setup).
  const dz =
    Math.max(0.01, input.sagittalSliceThicknessMm) + Math.max(0, input.sagittalSliceGapMm);

  // world(i,j,k) = i*dx*row + j*dy*col + k*dz*slice + t. FoV UI centers the stack at centerMm, so
  // centerMm = ((nx-1)/2)*dx*row + ((ny-1)/2)*dy*col + ((nz-1)/2)*dz*slice + t.
  const offsetToGridCenter = vec3Add(
    vec3Add(
      vec3Scale(basis.row, ((nx - 1) / 2) * dx),
      vec3Scale(basis.col, ((ny - 1) / 2) * dy),
    ),
    vec3Scale(basis.slice, ((nz - 1) / 2) * dz),
  );
  const t = vec3Sub(centerMm, offsetToGridCenter);

  return {
    isocenter_mm: iso,
    fov_mm: [fovX, fovY],
    matrix: [nx, ny],
    slice: {
      num_slices: nz,
      thickness_mm: input.sagittalSliceThicknessMm,
      gap_mm: input.sagittalSliceGapMm,
    },
    affine: affine4ScaledFromBasis(basis.row, basis.col, basis.slice, dx, dy, dz, t),
    ui: {
      orientation: prescription.orientation,
      angulation_lr_deg: prescription.angulationLRdeg ?? 0,
      angulation_ap_deg: prescription.angulationAPdeg ?? 0,
      angulation_z_deg: prescription.angulationZDeg ?? 0,
      slice_offset_mm: [input.sliceOffsetXMM, input.sliceOffsetYMM, input.sliceOffsetZMM],
      phase_encoding_direction: input.phaseEncodingDirection,
      frequency_encoding_direction: input.frequencyEncodingDirection,
    },
  };
}

/** Wrap geometry with sequence filename for API payloads. */
export type SequenceWithGeometryExport = {
  filename: string;
  geometry: SequenceGeometryJson;
};

/**
 * @deprecated Use {@link buildCamrieBackendPayload} from `camrieBackendPayload.ts` for the full
 * `examplePayload.json` shape. Kept for callers that only need filename + geometry slices.
 */
export function buildBackendSequencesPayload(
  sequences: { id: string; fileName: string }[],
  geometryBySequenceId: Record<string, SequenceGeometryJson> | undefined,
): { sequences: SequenceWithGeometryExport[] } {
  if (!geometryBySequenceId || Object.keys(geometryBySequenceId).length === 0) {
    throw new Error(
      "No saved geometry on this protocol. Save the protocol again after setting FoV / slices.",
    );
  }
  const out: SequenceWithGeometryExport[] = [];
  for (const s of sequences) {
    const g = geometryBySequenceId[s.id];
    if (!g) {
      throw new Error(`Missing geometry for sequence ${s.fileName} (${s.id}). Save the protocol again.`);
    }
    out.push({ filename: s.fileName, geometry: g });
  }
  return { sequences: out };
}
