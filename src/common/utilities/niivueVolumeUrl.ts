/**
 * Niivue infers image type from the volume `name` extension (see NVIMAGE_TYPE.parse).
 * Presigned URLs must not leak query strings into `name`, or loading fails with
 * "Image type not supported".
 */
export function niivueSafeVolumeName(url: string, fallbackFileName: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) {
      return decodeURIComponent(last);
    }
  } catch {
    /* relative or opaque URL */
  }
  const pathOnly = url.split(/[?#]/)[0];
  const last = pathOnly.split("/").filter(Boolean).pop();
  if (last) {
    return decodeURIComponent(last);
  }
  return fallbackFileName;
}
