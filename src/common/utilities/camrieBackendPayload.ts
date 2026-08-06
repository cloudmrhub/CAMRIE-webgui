import type { UploadedFile } from "cloudmr-ux/core/features/data/dataSlice";
import { buildMarieInputsFromInfo, type MarieBackendInputs } from "./marieZipManifest";
import type { SequenceGeometryJson } from "./sequenceGeometry";

/** Top-level job payload shape (see `public/examplePayload.json`). */
export type CamrieBackendPayload = {
  version: "v1";
  alias: string;
  output: CamrieOutputSettings;
  task: CamrieBackendTask;
};

export type CamrieOutputSettings = {
  matlab: boolean;
  SNR: boolean;
  RSSreconstruction: boolean;
};

export type CamrieBackendFileReference = {
  type: "file";
  id: string;
  options: {
    type: string;
    filename: string;
    options: Record<string, unknown>;
    bucket: string;
    key: string;
  };
};

export type CamrieBackendSequenceEntry = {
  alias: string;
  file: CamrieBackendFileReference;
  geometry: SequenceGeometryJson;
};

export type CamrieBackendTask = {
  name: "camrieJob";
  version: "v1";
  acquisition: number;
  type: "simulation";
  application: "CAMRIE";
  alias: string;
  pipeline: string;
  options: {
    sequences: CamrieBackendSequenceEntry[];
    bodymodel: CamrieBackendFileReference;
    marie_inputs: MarieBackendInputs;
  };
};

const PREVIEW_BUCKET = "cloudmr-data-cloudmrhub-brain-us-east-1";
const PREVIEW_USER_PREFIX = "CAMRIE/2d39bc29-3a7c-4e89-a6a9-1dc5fce0dea4";

/**
 * Hardcoded S3 file refs from `public/examplePayload.json` for built-in protocol sequences.
 * Used when `previewMode` is true and files are not yet uploaded to Data.
 */
export const PREVIEW_SEQUENCE_FILE_REFS: Record<string, CamrieBackendFileReference> = {
  "PD-Weighted_Spin_Echo.mtrk": {
    type: "file",
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    options: {
      type: "s3",
      filename: "PD-Weighted_Spin_Echo.mtrk",
      options: {},
      bucket: PREVIEW_BUCKET,
      key: `${PREVIEW_USER_PREFIX}/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d_PD-Weighted_Spin_Echo.mtrk`,
    },
  },
  "T1-Weighted_Spin_Echo.seq": {
    type: "file",
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    options: {
      type: "s3",
      filename: "T1-Weighted_Spin_Echo.seq",
      options: {},
      bucket: PREVIEW_BUCKET,
      key: `${PREVIEW_USER_PREFIX}/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e_T1-Weighted_Spin_Echo.seq`,
    },
  },
  "T1-Weighted_Spoiled_GRE.seq": {
    type: "file",
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    options: {
      type: "s3",
      filename: "T1-Weighted_Spoiled_GRE.seq",
      options: {},
      bucket: PREVIEW_BUCKET,
      key: `${PREVIEW_USER_PREFIX}/c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f_T1-Weighted_Spoiled_GRE.seq`,
    },
  },
};

export const PREVIEW_BODYMODEL_FILE_REF: CamrieBackendFileReference = {
  type: "file",
  id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  options: {
    type: "s3",
    filename: "MARIE_1_inp_Duke_HeadOverlap.zip",
    options: {},
    bucket: PREVIEW_BUCKET,
    key: "CAMRIE/data/MARIE_1_inp_Duke_HeadOverlap.zip",
  },
};

export const PREVIEW_MARIE_INPUTS: MarieBackendInputs = {
  b0: 3,
  nucleus: "1H",
  freq: 1.2773243555399999e8,
  basis_vie: "PWC",
  basis_sie: "RWG",
  basis_wie: "Triangle",
  phantom: "Duke_2mm",
  Number_of_tissues: 21,
  resolution: [0.002, 0.002, 0.002],
  coil: "Head_Overlap/OverlapCoil_2_stacks.msh",
  wire: "",
  shield: "",
  basis_support: "",
  basis_file: "",
  Number_of_Rx_channels: 16,
  Number_of_Tx_channels: 0,
  co_simulation: "YES",
  EM_Simulator: "MARIE_3.0_WSVIE_version",
};

export const PREVIEW_PIPELINE_ID = "b6078683-8d7f-3b5c-aeb1-cd9698ad571d";

export type S3LocationDescriptor = {
  bucket: string;
  key: string;
};

export type BuildCamrieBackendPayloadInput = {
  /** Top-level payload alias (e.g. protocol or job label). */
  alias: string;
  /** `task.alias` - defaults to alias when omitted. */
  taskAlias?: string;
  /** `task.pipeline` - pipeline UUID from CloudMR when known. */
  pipelineId?: string;
  output?: Partial<CamrieOutputSettings>;
  sequences: { id: string; fileName: string; alias?: string; uploadedFileId?: number }[];
  geometryBySequenceId: Record<string, SequenceGeometryJson>;
  /** When true, use hardcoded example file refs for sequences/bodymodel/marie_inputs if uploads are missing. */
  previewMode?: boolean;
  bodymodelFile?: UploadedFile | null;
  marieInfo?: Record<string, unknown> | null;
  /** User uploads from Data tab; used when not in previewMode or when a real upload exists. */
  dataFiles?: UploadedFile[];
};

const DEFAULT_OUTPUT: CamrieOutputSettings = {
  matlab: true,
  SNR: false,
  RSSreconstruction: true,
};

/** Parse CloudMR `UploadedFile.location` JSON into bucket + key (same shape as MROptimum `UFtoFR`). */
export function parseUploadedFileLocation(location: string): S3LocationDescriptor | null {
  try {
    const loc = JSON.parse(location) as Record<string, unknown>;
    const bucket =
      (typeof loc.Bucket === "string" && loc.Bucket) ||
      (typeof loc.bucket === "string" && loc.bucket) ||
      "";
    const key =
      (typeof loc.Key === "string" && loc.Key) ||
      (typeof loc.key === "string" && loc.key) ||
      "";
    if (bucket && key) {
      return { bucket, key };
    }
  } catch {
    /* invalid JSON */
  }
  return null;
}

export function uploadedFileToBackendFileRef(file: UploadedFile): CamrieBackendFileReference {
  const storageType = file.database ?? "s3";
  const s3 = parseUploadedFileLocation(file.location);
  if (!s3) {
    throw new Error(
      `Uploaded file "${file.fileName}" (id ${file.id}) has no valid S3 location. ` +
        `Expected location JSON with Bucket and Key from the CloudMR data API.`,
    );
  }
  return {
    type: "file",
    id: String(file.id),
    options: {
      type: storageType,
      filename: file.fileName,
      options: {},
      bucket: s3.bucket,
      key: s3.key,
    },
  };
}

function findUploadedFileById(
  uploadedFileId: number,
  dataFiles: UploadedFile[],
): UploadedFile | undefined {
  return dataFiles.find((f) => f.id === uploadedFileId);
}

function findUploadedFileByName(
  fileName: string,
  dataFiles: UploadedFile[],
): UploadedFile | undefined {
  const lower = fileName.toLowerCase();
  return (
    dataFiles.find((f) => f.fileName === fileName) ??
    dataFiles.find((f) => f.fileName.toLowerCase() === lower) ??
    dataFiles.find((f) => {
      const s3 = parseUploadedFileLocation(f.location);
      if (!s3) return false;
      return s3.key.endsWith(`/${fileName}`) || s3.key.endsWith(`_${fileName}`);
    })
  );
}

function placeholderSequenceFileRef(fileName: string): CamrieBackendFileReference {
  const id = `preview-${fileName.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  return {
    type: "file",
    id,
    options: {
      type: "s3",
      filename: fileName,
      options: {},
      bucket: PREVIEW_BUCKET,
      key: `${PREVIEW_USER_PREFIX}/${id}_${fileName}`,
    },
  };
}

function resolveSequenceFileRef(
  fileName: string,
  uploadedFileId: number | undefined,
  dataFiles: UploadedFile[],
  previewMode: boolean,
): CamrieBackendFileReference {
  let uploaded =
    uploadedFileId != null ? findUploadedFileById(uploadedFileId, dataFiles) : undefined;

  if (uploadedFileId != null && !uploaded && !previewMode) {
    throw new Error(
      `Sequence "${fileName}" references upload id ${uploadedFileId}, but that file is no longer in Data.`,
    );
  }

  uploaded ??= findUploadedFileByName(fileName, dataFiles);
  if (uploaded) {
    return uploadedFileToBackendFileRef(uploaded);
  }
  if (previewMode) {
    return (
      PREVIEW_SEQUENCE_FILE_REFS[fileName] ?? placeholderSequenceFileRef(fileName)
    );
  }
  throw new Error(
    `Sequence file "${fileName}" is not in your uploaded Data. Upload it on the Home page, then add it to the protocol.`,
  );
}

/**
 * Build the full CAMRIE backend JSON matching `examplePayload.json`, using live Setup inputs.
 */
export function buildCamrieBackendPayload(
  input: BuildCamrieBackendPayloadInput,
): CamrieBackendPayload {
  const {
    alias,
    taskAlias,
    pipelineId,
    sequences,
    geometryBySequenceId,
    previewMode = false,
    bodymodelFile,
    marieInfo,
    dataFiles = [],
  } = input;

  if (sequences.length === 0) {
    throw new Error("Add at least one sequence to the protocol.");
  }

  const sequenceEntries: CamrieBackendSequenceEntry[] = [];
  for (const seq of sequences) {
    const geometry = geometryBySequenceId[seq.id];
    if (!geometry) {
      throw new Error(
        `Missing geometry for sequence ${seq.fileName} (${seq.id}). Save the protocol after setting FoV / slices.`,
      );
    }
    const fileName = seq.fileName ?? seq.id;
    const alias = seq.alias?.trim() || fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
    sequenceEntries.push({
      alias,
      file: resolveSequenceFileRef(fileName, seq.uploadedFileId, dataFiles, previewMode),
      geometry,
    });
  }

  let bodymodel: CamrieBackendFileReference;
  if (bodymodelFile) {
    bodymodel = uploadedFileToBackendFileRef(bodymodelFile);
  } else if (previewMode) {
    bodymodel = PREVIEW_BODYMODEL_FILE_REF;
  } else {
    throw new Error("Select a MARIE model (.zip) from storage before exporting backend JSON.");
  }

  let marie_inputs: MarieBackendInputs;
  if (marieInfo && Object.keys(marieInfo).length > 0) {
    marie_inputs = buildMarieInputsFromInfo(marieInfo);
  } else if (previewMode) {
    marie_inputs = PREVIEW_MARIE_INPUTS;
  } else {
    throw new Error(
      "MARIE model info.json is missing. Re-select the model zip so /unzip returns info metadata.",
    );
  }

  const output: CamrieOutputSettings = {
    ...DEFAULT_OUTPUT,
    ...input.output,
  };

  const resolvedPipeline =
    pipelineId ?? (previewMode ? PREVIEW_PIPELINE_ID : "");

  return {
    version: "v1",
    alias,
    output,
    task: {
      name: "camrieJob",
      version: "v1",
      acquisition: 2,
      type: "simulation",
      application: "CAMRIE",
      alias: taskAlias ?? alias,
      pipeline: resolvedPipeline,
      options: {
        sequences: sequenceEntries,
        bodymodel,
        marie_inputs,
      },
    },
  };
}
