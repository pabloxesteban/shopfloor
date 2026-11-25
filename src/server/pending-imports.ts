import "server-only";

/**
 * Extractions waiting for review. The server remembers which fields it
 * flagged, so a client cannot skip the review by sending an empty list.
 * In memory, like the rest of the data; entries expire after 30 minutes.
 */
interface PendingImport {
  flaggedPaths: string[];
  createdAt: number;
}

const TTL_MS = 30 * 60 * 1000;
const store = globalThis as typeof globalThis & { __shopfloorPendingImports?: Map<string, PendingImport> };

function pending(): Map<string, PendingImport> {
  store.__shopfloorPendingImports ??= new Map();
  return store.__shopfloorPendingImports;
}

function sweep(now: number) {
  for (const [id, entry] of pending()) if (now - entry.createdAt > TTL_MS) pending().delete(id);
}

export function registerPendingImport(flaggedPaths: string[], now = Date.now()): string {
  sweep(now);
  const id = crypto.randomUUID();
  pending().set(id, { flaggedPaths, createdAt: now });
  return id;
}

export function getPendingImport(id: string, now = Date.now()): PendingImport | undefined {
  sweep(now);
  return pending().get(id);
}

export function completePendingImport(id: string): void {
  pending().delete(id);
}
