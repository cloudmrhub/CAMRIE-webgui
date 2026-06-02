import JSZip from "jszip";

function normalizeZipPath(p: string): string {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

function zipHasFile(zip: JSZip, logicalPath: string): boolean {
  const norm = normalizeZipPath(logicalPath);
  const entry = zip.files[norm];
  return !!entry && !entry.dir;
}

type ManifestWithData = { data?: unknown[] };

/**
 * Drops `data[]` rows whose `filename` is not present in the zip so `/unzip` does not
 * fail on trimmed archives. MARIE manifests keep full `data` in info.json by default.
 *
 * Use as `preprocess` on model zip upload. Already-uploaded objects on S3 are unchanged
 * until you upload again through the UI.
 */
export async function preprocessMarieModelZip(file: File): Promise<File | number> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return file;
  }

  try {
    const zip = await JSZip.loadAsync(file);
    const infoEntry = zip.file("info.json");
    if (!infoEntry) {
      return file;
    }

    const raw = await infoEntry.async("string");
    const parsed = JSON.parse(raw) as ManifestWithData;
    if (!Array.isArray(parsed.data)) {
      return file;
    }

    const filtered = parsed.data.filter((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }
      const fn = (row as { filename?: string }).filename;
      if (!fn || typeof fn !== "string") {
        return false;
      }
      return zipHasFile(zip, fn);
    });

    if (filtered.length === parsed.data.length) {
      return file;
    }

    parsed.data = filtered;
    zip.file("info.json", JSON.stringify(parsed, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    return new File([blob], file.name, {
      type: "application/zip",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.error("preprocessMarieModelZip:", e);
    return 400;
  }
}
