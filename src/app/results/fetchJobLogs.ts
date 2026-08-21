import axios from "axios";
import { Job } from "cloudmr-ux/core/features/jobs/jobsSlice";
import { UploadedFile } from "cloudmr-ux/core/features/data/dataSlice";
import { AuthenticatedHttpClient } from "cloudmr-ux/core/common/utilities/AuthenticatedRequests";

function asArrayBuffer(data: unknown): ArrayBuffer | undefined {
  if (!data) return undefined;
  if (data instanceof ArrayBuffer) return data.byteLength ? data : undefined;
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    if (!view.byteLength) return undefined;
    return view.buffer.slice(
      view.byteOffset,
      view.byteOffset + view.byteLength,
    ) as ArrayBuffer;
  }
  return undefined;
}

function downloadableResultFiles(job: Job): UploadedFile[] {
  return (job.files ?? []).filter(
    (file) => file?.link && file.link !== "unknown",
  );
}

function isErrorTxtName(name: string | undefined): boolean {
  if (!name) return false;
  return name.replace(/^.*[/\\]/, "").toLowerCase() === "error.txt";
}

function isInfoJsonName(name: string | undefined): boolean {
  if (!name) return false;
  return name.replace(/^.*[/\\]/, "").toLowerCase() === "info.json";
}

function extractInfoLog(doc: any): unknown {
  if (!doc || typeof doc !== "object") return undefined;
  return (
    doc.headers?.log ??
    doc.headers?.logs ??
    doc.log ??
    doc.logs
  );
}

function formatLogEntry(entry: unknown): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "number" || typeof entry === "boolean") {
    return String(entry);
  }
  if (typeof entry === "object") {
    const item = entry as Record<string, unknown>;
    const when = item.when ?? item.time;
    const what = item.what ?? item.message ?? item.msg;
    if (when != null || what != null) {
      return [when, what].filter((part) => part != null && part !== "").join(": ");
    }
    try {
      return JSON.stringify(entry);
    } catch {
      return String(entry);
    }
  }
  return String(entry);
}

function formatInfoLogs(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") return raw.length ? raw : undefined;
  if (Array.isArray(raw)) {
    const lines = raw.map(formatLogEntry).filter((line) => line.length > 0);
    return lines.length ? lines.join("\n") : undefined;
  }
  if (typeof raw === "object") {
    const nested = extractInfoLog(raw);
    if (nested != null && nested !== raw) {
      return formatInfoLogs(nested);
    }
    const line = formatLogEntry(raw);
    return line.length ? line : undefined;
  }
  return String(raw);
}

function parseJsonText(text: string): any | undefined {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export type JobLogSources = {
  errorTxt?: string;
  infoLogText?: string;
};

async function jobLogsFromBuffer(buffer: ArrayBuffer): Promise<JobLogSources> {
  const sources: JobLogSources = {};
  const bytes = new Uint8Array(buffer);
  const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const name = entry.name.replace(/^.*[/\\]/, "").toLowerCase();
        if (name === "error.txt") {
          sources.errorTxt = await entry.async("string");
        } else if (name === "info.json") {
          const parsed = parseJsonText(await entry.async("string"));
          sources.infoLogText = formatInfoLogs(extractInfoLog(parsed));
        }
      }
    } catch (e) {
      console.error("Logs: JSZip failed while reading job logs", e);
    }
    return sources;
  }
  return sources;
}

async function fetchDownloadedZip(
  url: string,
): Promise<ArrayBuffer | undefined> {
  try {
    const res = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf?.byteLength) return buf;
    }
  } catch (e) {
    console.error("Logs: fetch of result file failed", e);
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 120000,
      withCredentials: false,
    });
    const buf = asArrayBuffer(response.data);
    if (buf) return buf;
  } catch (e) {
    console.error("Logs: axios GET of result file failed", e);
  }

  try {
    const response = await AuthenticatedHttpClient.request({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 120000,
    });
    const buf = asArrayBuffer((response as any).data);
    if (buf) return buf;
  } catch (e) {
    console.error("Logs: authenticated GET of result file failed", e);
  }

  return undefined;
}

/**
 * Fetch `error.txt` and `info.json` `log` entries from a job's result files.
 */
export async function fetchJobLogSources(job: Job): Promise<JobLogSources> {
  const combined: JobLogSources = {};
  for (const file of downloadableResultFiles(job)) {
    const buffer = await fetchDownloadedZip(file.link);
    if (!buffer) continue;
    if (isErrorTxtName(file.fileName) && combined.errorTxt == null) {
      combined.errorTxt = new TextDecoder().decode(buffer);
      continue;
    }
    if (isInfoJsonName(file.fileName) && combined.infoLogText == null) {
      combined.infoLogText = formatInfoLogs(
        extractInfoLog(parseJsonText(new TextDecoder().decode(buffer))),
      );
      continue;
    }
    const fromZip = await jobLogsFromBuffer(buffer);
    if (combined.errorTxt == null && fromZip.errorTxt != null) {
      combined.errorTxt = fromZip.errorTxt;
    }
    if (combined.infoLogText == null && fromZip.infoLogText != null) {
      combined.infoLogText = fromZip.infoLogText;
    }
    if (combined.errorTxt != null && combined.infoLogText != null) break;
  }
  return combined;
}
