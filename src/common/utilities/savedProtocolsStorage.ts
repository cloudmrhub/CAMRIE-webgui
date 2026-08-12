import type {
  LegacySequenceGeometryJson,
  SequenceGeometryJson,
} from "./sequenceGeometry";

export type SavedProtocol = {
  id: string;
  label: string;
  sequenceIds: string[];
  /** Per-sequence geometry snapshots at last save (one entry per protocol sequence id). */
  sequenceGeometry?: Record<string, SequenceGeometryJson | LegacySequenceGeometryJson>;
};

const STORAGE_PREFIX = "camrie-saved-protocols";
/** Pre–per-user storage key (migrated once for the first account that loads). */
const LEGACY_STORAGE_KEY = "camrie-saved-protocols";

function isSavedProtocol(value: unknown): value is SavedProtocol {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as SavedProtocol).id === "string" &&
    typeof (value as SavedProtocol).label === "string" &&
    Array.isArray((value as SavedProtocol).sequenceIds) &&
    ((value as SavedProtocol).sequenceGeometry === undefined ||
      (typeof (value as SavedProtocol).sequenceGeometry === "object" &&
        (value as SavedProtocol).sequenceGeometry !== null))
  );
}

/** Stable localStorage namespace per signed-in user (email from auth state). */
export function normalizeSavedProtocolUserKey(email: string | null | undefined): string {
  const trimmed = email?.trim().toLowerCase();
  return trimmed && trimmed.length > 0 ? trimmed : "anonymous";
}

export function savedProtocolsStorageKey(userKey: string): string {
  return `${STORAGE_PREFIX}:${userKey}`;
}

export function loadSavedProtocolsForUser(userKey: string): SavedProtocol[] {
  try {
    const key = savedProtocolsStorageKey(userKey);
    let raw = localStorage.getItem(key);

    if (!raw && userKey !== "anonymous") {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = legacy;
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedProtocol);
  } catch {
    return [];
  }
}

export function persistSavedProtocolsForUser(
  userKey: string,
  protocols: SavedProtocol[],
): void {
  const key = savedProtocolsStorageKey(userKey);
  if (protocols.length > 0) {
    localStorage.setItem(key, JSON.stringify(protocols));
  } else {
    localStorage.removeItem(key);
  }
}
