import fs from "node:fs";
import path from "node:path";
import type { DocumentMeta } from "./document-records.js";

/**
 * Document fallback store when DynamoDB is unavailable.
 * Persists to `.data/document-sessions.json` in dev so uploads survive
 * server restarts and separate serverless invocations.
 */
interface StoredDocument {
  meta: DocumentMeta;
  contentBase64: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "document-sessions.json");

type SessionCache = Map<string, StoredDocument>;

function readDiskSessions(): SessionCache {
  try {
    if (!fs.existsSync(DATA_FILE)) return new Map();
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Record<
      string,
      StoredDocument
    >;
    return new Map(Object.entries(raw));
  } catch (error) {
    console.warn("[documents] Failed to read session file:", error);
    return new Map();
  }
}

function writeDiskSessions(sessions: SessionCache) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(Object.fromEntries(sessions)),
      "utf8",
    );
  } catch (error) {
    console.warn("[documents] Failed to write session file:", error);
  }
}

const globalCache = globalThis as typeof globalThis & {
  __documentSessions?: SessionCache;
};

function sessions(): SessionCache {
  if (!globalCache.__documentSessions) {
    globalCache.__documentSessions = readDiskSessions();
    console.info(
      `[documents] Loaded ${globalCache.__documentSessions.size} session document(s) from disk`,
    );
  }
  return globalCache.__documentSessions;
}

function persist() {
  writeDiskSessions(sessions());
}

export function saveDocumentSession(meta: DocumentMeta, contentBase64: string) {
  sessions().set(meta.id, { meta, contentBase64 });
  persist();
  console.info("[documents] Saved to session store", {
    id: meta.id,
    patientId: meta.patientId,
    name: meta.name,
    sizeBytes: meta.sizeBytes,
  });
}

export function getDocumentSessionMeta(id: string): DocumentMeta | null {
  return sessions().get(id)?.meta ?? null;
}

export function getDocumentSessionContent(id: string): string | null {
  return sessions().get(id)?.contentBase64 ?? null;
}

export function deleteDocumentSession(id: string) {
  if (!sessions().delete(id)) return;
  persist();
  console.info("[documents] Removed from session store", { id });
}

export function listDocumentSessions(hospitalId: string, patientId?: string): DocumentMeta[] {
  let items = Array.from(sessions().values()).map((d) => d.meta);
  items = items.filter((d) => d.hospitalId === hospitalId);
  if (patientId) items = items.filter((d) => d.patientId === patientId);
  return items;
}

export function isDocumentInSession(id: string) {
  return sessions().has(id);
}
