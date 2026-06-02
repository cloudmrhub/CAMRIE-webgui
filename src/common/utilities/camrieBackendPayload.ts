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

export type BuildCamrieBackendPayloadInput = {
  /** Top-level payload alias (e.g. protocol or job label). */
  alias: string;
  /** `task.alias` — defaults to alias when omitted. */
  taskAlias?: string;
  /** `task.pipeline` — pipeline UUID from CloudMR when known. */
  pipelineId?: string;
  output?: Partial<CamrieOutputSettings>;
  sequences: { id: string; fileName: string }[];
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

export function uploadedFileToBackendFileRef(file: UploadedFile): CamrieBackendFileReference {
  let bucket = "unknown";
  let key = "unknown";
  const storageType = file.database ?? "s3";
  try {
    const loc = JSON.parse(file.location) as { Bucket?: string; Key?: string };
    if (loc.Bucket) bucket = loc.Bucket;
    if (loc.Key) key = loc.Key;
  } catch {
    /* local / legacy */
  }
  return {
    type: "file",
    id: String(file.id),
    options: {
      type: storageType,
      filename: file.fileName,
      options: {},
      bucket,
      key,
    },
  };
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
      try {
        const { Key } = JSON.parse(f.location) as { Key?: string };
        return Key != null && (Key.endsWith(`/${fileName}`) || Key.endsWith(`_${fileName}`));
      } catch {
        return false;
      }
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
  dataFiles: UploadedFile[],
  previewMode: boolean,
): CamrieBackendFileReference {
  const uploaded = findUploadedFileByName(fileName, dataFiles);
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
    sequenceEntries.push({
      file: resolveSequenceFileRef(fileName, dataFiles, previewMode),
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
