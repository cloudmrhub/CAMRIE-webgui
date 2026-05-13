import { AuthenticatedHttpClient, getEndpoints } from "cloudmr-ux/core";

/**
 * CAMRIE MARIE input zips are expanded on the cloud (same pattern as MROptimum Results):
 * POST `/unzip` with the uploaded file's `location` JSON payload.
 *
 * The backend should open the zip on S3 (or equivalent), read `info.json`, and respond with:
 * - `data`: array of entries Niivue can load (`name`, `link`, optional `filename`, `id`, `type`)
 * - `info`: optional wrapper around parsed `info.json`; alternatively the API may return the manifest root (`headers` + `data`) like MARIE’s file.
 * - `previewImageLink` (optional): HTTPS URL for an image extracted from the zip (e.g. first `other/*.jpg`)
 *
 * If your API nests metadata differently, adapt the server response or extend `resolveMarieInfoDocument` below.
 */
export type MarieZipVolumeEntry = {
  filename?: string;
  name: string;
  /** Present after `/unzip` hydrates paths to signed GET URLs. */
  link?: string;
  id?: number | string;
  type?: string;
  dim?: number | null;
  description?: string;
};

export type MarieZipUnzipApiBody = {
  data?: MarieZipVolumeEntry[];
  info?: Record<string, unknown>;
  previewImageLink?: string;
  /** Some deployments return a structured failure in the body instead of HTTP errors. */
  success?: boolean;
  message?: string;
  error?: string;
};

export type MarieSetupModelFields = {
  objectName: string;
  b0: string;
  nucleus: string;
  frequency: string;
  resolution: string;
  numOfTissues: string;
  coil: string;
  receiveChannels: number;
  transmitChannels: number;
  emSimulator: string;
};

const MARIE_ZIP_COIL_LABEL = "16-Ch 3T head Surface Coil";
const MARIE_ZIP_NUCLEUS_LABEL = "1H";

function unwrapAxiosResponseBodyError(e: unknown): Error {
  if (typeof e === "object" && e !== null && "response" in e) {
    const data = (e as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      const err = o.error;
      const msg = o.message;
      const piece =
        typeof err === "string"
          ? err
          : typeof msg === "string"
            ? msg
            : undefined;
      if (piece) {
        return new Error(piece);
      }
    }
  }
  return e instanceof Error ? e : new Error(String(e));
}

function resolveMarieInfoDocument(body: MarieZipUnzipApiBody): Record<string, unknown> | undefined {
  if (body.info && typeof body.info === "object") return body.info as Record<string, unknown>;
  const raw = body as Record<string, unknown>;
  if (raw.headers && typeof raw.headers === "object") return raw;
  return undefined;
}

/**
 * MARIE `info.json` nests scan inputs under `headers.Inputs` (capital I). Fall back to `inputs` / top-level.
 */
export function getMarieInputsSection(info: Record<string, unknown>): Record<string, unknown> {
  const headers = info.headers as Record<string, unknown> | undefined;
  const fromHeaders = headers?.Inputs ?? headers?.inputs;
  if (fromHeaders && typeof fromHeaders === "object" && !Array.isArray(fromHeaders)) {
    return fromHeaders as Record<string, unknown>;
  }
  const direct = info.Inputs ?? info.inputs;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  return info;
}

function formatB0FromInputs(inputs: Record<string, unknown>): string {
  const raw = inputs.b0 ?? inputs.B0;
  if (raw === undefined || raw === null) return "—";
  const n = Number(raw);
  if (Number.isFinite(n)) return `${n}T`;
  const s = String(raw).trim();
  return /t$/i.test(s) ? s : s;
}

/** `freq` is treated as Hz when magnitude is large (e.g. 127e6); otherwise assumed already MHz. */
function freqToMhzTwoDecimals(freq: unknown): string {
  if (freq === undefined || freq === null) return "—";
  const n = Number(freq);
  if (!Number.isFinite(n)) return String(freq);
  const mhz = Math.abs(n) >= 1e4 ? n / 1e6 : n;
  return mhz.toFixed(2);
}

/** Single spacing in m (<1) → mm; otherwise treat as mm. */
function spacingMetersToMm(spacing: number): number {
  return spacing > 0 && spacing < 1 ? spacing * 1000 : spacing;
}

/** Scalar or `[dx,dy,dz]` in meters (MARIE) → isotropic mm label. */
function resolutionToMmIsotropicLabel(resolution: unknown): string {
  if (resolution === undefined || resolution === null) return "—";
  if (Array.isArray(resolution)) {
    const mmVals = resolution.map((v) => spacingMetersToMm(Number(v))).filter((v) => Number.isFinite(v));
    if (mmVals.length === 0) return "—";
    const avg = mmVals.reduce((a, b) => a + b, 0) / mmVals.length;
    const spread = Math.max(...mmVals) - Math.min(...mmVals);
    const rounded =
      spread > 1e-6 * Math.max(...mmVals.map(Math.abs))
        ? Number(avg.toFixed(4))
        : Number.isInteger(avg)
          ? avg
          : Number(avg.toFixed(4));
    return `${rounded} mm isotropic`;
  }
  const n = Number(resolution);
  if (!Number.isFinite(n)) return String(resolution);
  const mm = spacingMetersToMm(n);
  const rounded = Number.isInteger(mm) ? mm : Number(mm.toFixed(4));
  return `${rounded} mm isotropic`;
}

function intField(info: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = info[k];
    if (v === undefined || v === null) continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function stringField(info: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = info[k];
    if (v === undefined || v === null) continue;
    return String(v);
  }
  return "—";
}

export function marieInfoJsonToModelFields(
  info: Record<string, unknown>,
  displayFileName: string,
): MarieSetupModelFields {
  const baseName = displayFileName.replace(/\.zip$/i, "");
  const inputs = getMarieInputsSection(info);

  const phantom =
    inputs.phantom != null && String(inputs.phantom).trim() !== ""
      ? String(inputs.phantom)
      : undefined;

  const objectFromLegacy =
    stringField(info, "Object_Name", "object_name", "objectName") !== "—"
      ? stringField(info, "Object_Name", "object_name", "objectName")
      : undefined;

  const nucleusRaw = inputs.nucleus ?? inputs.Nucleus;
  const nucleus =
    nucleusRaw != null && String(nucleusRaw).trim() !== ""
      ? String(nucleusRaw).trim()
      : MARIE_ZIP_NUCLEUS_LABEL;

  return {
    objectName: phantom ?? objectFromLegacy ?? baseName,
    b0: formatB0FromInputs(inputs),
    nucleus,
    frequency: freqToMhzTwoDecimals(inputs.freq ?? inputs.Freq),
    resolution: resolutionToMmIsotropicLabel(inputs.resolution ?? inputs.Resolution),
    numOfTissues: stringField(
      inputs,
      "Number_of_tissues",
      "number_of_tissues",
      "Number_of_Tissues",
    ),
    coil: MARIE_ZIP_COIL_LABEL,
    receiveChannels: intField(inputs, "Number_of_Rx_channels", "number_of_rx_channels"),
    transmitChannels: intField(
      inputs,
      "number_of_Tx_channels",
      "Number_of_Tx_channels",
      "number_of_tx_channels",
    ),
    emSimulator: stringField(inputs, "EM_Simulator", "em_simulator"),
  };
}

const NII_PATTERN = /\.nii(\.gz)?$/i;

/** Niivue loads only remote NIfTI URLs; skip meshes, JSON, folders, and preview images. */
export function marieVolumeEntriesToMap(entries: MarieZipVolumeEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) {
    const url = e.link;
    if (!url || typeof url !== "string") continue;

    const path = e.filename || "";
    if (!NII_PATTERN.test(path) && !NII_PATTERN.test(url)) continue;

    const label =
      (e.name && String(e.name).trim()) ||
      path.split("/").pop() ||
      "volume";
    out[label] = url;
  }
  return out;
}

function inferPreviewImageLink(entries: MarieZipVolumeEntry[]): string | undefined {
  const preview =
    entries.find(
      (e) =>
        e.link &&
        (/other\//i.test(e.filename || "") || /geometry/i.test(e.filename || "")) &&
        /\.(jpe?g|png|webp)$/i.test(e.filename || ""),
    ) ||
    entries.find((e) => e.description === "model_preview" || e.name === "Geometry preview");
  return preview?.link;
}

export type MarieZipManifestResult = {
  volumes: Record<string, string>;
  card: MarieSetupModelFields;
  previewImageLink?: string;
};

/**
 * Calls the shared CloudMR `/unzip` endpoint with the storage descriptor for an uploaded zip.
 */
export async function fetchMarieZipManifest(
  locationPayload: unknown,
  displayFileName: string,
): Promise<MarieZipManifestResult> {
  const endpoints = getEndpoints();
  let res;
  try {
    res = await AuthenticatedHttpClient.post(endpoints.UNZIP, locationPayload, {
      timeout: 120_000,
    });
  } catch (e) {
    throw unwrapAxiosResponseBodyError(e);
  }

  const body = res.data as MarieZipUnzipApiBody;
  if (body && typeof body === "object" && body.success === false) {
    const detail =
      typeof body.error === "string"
        ? body.error
        : typeof body.message === "string"
          ? body.message
          : JSON.stringify(body.error ?? body.message ?? body);
    throw new Error(detail);
  }

  const entries = Array.isArray(body.data) ? body.data : [];
  const volumes = marieVolumeEntriesToMap(entries);

  const info = resolveMarieInfoDocument(body);
  const card = info
    ? marieInfoJsonToModelFields(info, displayFileName)
    : {
        objectName: displayFileName.replace(/\.zip$/i, ""),
        b0: "—",
        nucleus: MARIE_ZIP_NUCLEUS_LABEL,
        frequency: "—",
        resolution: "—",
        numOfTissues: "—",
        coil: MARIE_ZIP_COIL_LABEL,
        receiveChannels: 0,
        transmitChannels: 0,
        emSimulator: "—",
      };

  return {
    volumes,
    card,
    previewImageLink: body.previewImageLink ?? inferPreviewImageLink(entries),
  };
}
