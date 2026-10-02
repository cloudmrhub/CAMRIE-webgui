import { Job } from "cloudmr-ux/core/features/jobs/jobsSlice";
import {
  setupSetters,
  type CamrieRerunSettings,
} from "../../features/setup/setupSlice";
import type { AppDispatch } from "../../features/store";
import { fetchJobJsonDocuments } from "./fetchJobLogs";

function asObject(raw: unknown): any {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw.trim());
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw;
  return undefined;
}

function optionsWithSequences(node: any): any | undefined {
  if (!node || typeof node !== "object" || Array.isArray(node)) return undefined;
  if (Array.isArray(node.sequences)) return node;
  if (node.options && Array.isArray(node.options.sequences)) return node.options;
  return undefined;
}

function findCamrieOptions(raw: unknown, depth = 0): any | undefined {
  const obj = asObject(raw);
  if (!obj || depth > 8) return undefined;

  const direct =
    optionsWithSequences(obj.headers?.options) ??
    optionsWithSequences(obj.task) ??
    optionsWithSequences(obj.options) ??
    optionsWithSequences(obj);
  if (direct) return direct;

  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const value of values) {
    if (value && typeof value === "object") {
      const found = findCamrieOptions(value, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function fileNameOf(file: any): string | undefined {
  const name = file?.options?.filename ?? file?.filename ?? file?.fileName;
  if (typeof name !== "string" || !name.trim()) return undefined;
  return name.replace(/^.*[/\\]/, "");
}

function settingsFromOptions(
  options: any,
  source: any,
  job: Job,
): CamrieRerunSettings | undefined {
  const sequences = (options?.sequences ?? [])
    .map((seq: any) => {
      const fileName = fileNameOf(seq?.file) ?? seq?.alias;
      if (!fileName) return undefined;
      return {
        fileName,
        alias: typeof seq?.alias === "string" && seq.alias.trim() ? seq.alias : fileName,
        geometry: seq?.geometry,
        spinFactor: typeof seq?.spin_factor === "number" ? seq.spin_factor : undefined,
        slicePadding: typeof seq?.slice_padding === "number" ? seq.slice_padding : undefined,
      };
    })
    .filter(Boolean);
  if (sequences.length === 0) return undefined;

  const jobWithUnit = job as Job & { computing_unit_id?: string; mode?: string };
  const computingUnitId =
    source?.computing_unit_id ??
    source?.headers?.options?.computing_unit_id ??
    source?.task?.computing_unit_id ??
    jobWithUnit.computing_unit_id;
  const mode =
    source?.mode ??
    source?.headers?.options?.mode ??
    source?.task?.mode ??
    jobWithUnit.mode;

  return {
    computingUnitId: computingUnitId ? String(computingUnitId) : undefined,
    mode: mode ? String(mode) : undefined,
    bodymodelFilename: fileNameOf(options?.bodymodel),
    sequences,
  };
}

/**
 * Read CAMRIE setup (sequences, geometry, body model) from a job result
 * and ask Set Up to restore it.
 */
export async function retryCamrieJob(
  job: Job,
  dispatch: AppDispatch,
): Promise<boolean> {
  let settings: CamrieRerunSettings | undefined;
  const documents = await fetchJobJsonDocuments(job);
  for (const document of documents) {
    const options = findCamrieOptions(document);
    if (!options) continue;
    settings = settingsFromOptions(options, document, job);
    if (settings) break;
  }
  if (!settings) {
    const options = findCamrieOptions(job.setup) ?? findCamrieOptions(job);
    if (options) settings = settingsFromOptions(options, job.setup ?? job, job);
  }
  if (!settings) return false;
  dispatch(setupSetters.loadCamrieRerun(settings));
  return true;
}
