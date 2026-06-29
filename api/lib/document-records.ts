import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  stripKeys,
} from "./dynamodb";
import { prefixFilter, toDocumentItem } from "./items";
import { withTimeout } from "./fast-fallback";
import {
  deleteDocumentSession,
  getDocumentSessionContent,
  getDocumentSessionMeta,
  isDocumentInSession,
  listDocumentSessions,
  saveDocumentSession,
} from "./document-session-store";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
/** Base64 chars per DynamoDB chunk (~300KB raw per chunk, under 400KB item limit). */
const CHUNK_SIZE = 280_000;

export interface DocumentMeta {
  id: string;
  patientId: string;
  name: string;
  category: string;
  date: string;
  uploadedBy: string;
  uploadedByUserId: string;
  sizeBytes: number;
  mimeType: string;
  status: string;
  hospitalId: string;
  chunkCount: number;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeDocumentMeta(raw: Record<string, unknown>): DocumentMeta {
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    name: String(raw.name ?? ""),
    category: String(raw.category ?? "Medical Records"),
    date: String(raw.date ?? ""),
    uploadedBy: String(raw.uploadedBy ?? ""),
    uploadedByUserId: String(raw.uploadedByUserId ?? ""),
    sizeBytes: Number(raw.sizeBytes ?? 0),
    mimeType: String(raw.mimeType ?? "application/octet-stream"),
    status: String(raw.status ?? "reviewed"),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    chunkCount: Number(raw.chunkCount ?? 0),
  };
}

export function documentMetaToClient(meta: DocumentMeta) {
  return {
    id: meta.id,
    patientId: meta.patientId,
    name: meta.name,
    category: meta.category,
    date: meta.date,
    uploadedBy: meta.uploadedBy,
    size: formatFileSize(meta.sizeBytes),
    type: meta.mimeType.includes("pdf")
      ? "PDF"
      : meta.mimeType.includes("png")
        ? "PNG"
        : meta.mimeType.includes("jpeg") || meta.mimeType.includes("jpg")
          ? "JPEG"
          : meta.mimeType.split("/").pop()?.toUpperCase() ?? "FILE",
    status: meta.status,
    hospitalId: meta.hospitalId,
  };
}

export async function listDocumentRecords(hospitalId: string, patientId?: string) {
  let items: DocumentMeta[] = [];

  try {
    const result = await withTimeout(
      dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 500,
          ...prefixFilter(ENTITY_PREFIX.document),
        }),
      ),
      2500,
      { Items: [] },
    );

    items = (result.Items ?? [])
      .filter((item) => String(item.SK) === "METADATA")
      .map((item) => normalizeDocumentMeta(stripKeys(item as Record<string, unknown>)))
      .filter((d) => d.hospitalId === hospitalId);

    if (patientId) {
      items = items.filter((d) => d.patientId === patientId);
    }
  } catch (error) {
    console.warn("[documents] DynamoDB scan failed, using session fallback:", error);
  }

  const seen = new Set(items.map((d) => d.id));
  for (const sessionDoc of listDocumentSessions(hospitalId, patientId)) {
    if (!seen.has(sessionDoc.id)) items.push(sessionDoc);
  }

  console.info("[documents] listDocumentRecords", {
    hospitalId,
    patientId: patientId ?? "all",
    dynamoCount: seen.size,
    sessionCount: items.length - seen.size,
    total: items.length,
  });

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDocumentMeta(id: string) {
  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `${ENTITY_PREFIX.document}${id}`, SK: "METADATA" },
      }),
    );
    if (result.Item) {
      return normalizeDocumentMeta(stripKeys(result.Item as Record<string, unknown>));
    }
  } catch (error) {
    console.warn("getDocumentMeta failed, session fallback:", error);
  }
  return getDocumentSessionMeta(id);
}

async function putDocumentChunks(docId: string, base64: string) {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((data, index) =>
      dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `${ENTITY_PREFIX.document}${docId}`,
            SK: `CHUNK#${String(index).padStart(4, "0")}`,
            entityType: "DOCUMENT_CHUNK",
            data,
          },
        }),
      ),
    ),
  );

  return chunks.length;
}

export async function putDocumentRecord(
  meta: Record<string, unknown>,
  contentBase64: string,
) {
  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new Error(`File exceeds ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB limit`);
  }

  const id = String(meta.id ?? `doc-${Date.now()}`);
  const normalized = normalizeDocumentMeta({
    ...meta,
    id,
    sizeBytes: buffer.length,
    chunkCount: 1,
  });

  // Always keep a local copy so uploads work when DynamoDB is down or unreachable.
  saveDocumentSession(normalized, contentBase64);

  try {
    const chunkCount = await putDocumentChunks(id, contentBase64);
    normalized.chunkCount = chunkCount;

    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toDocumentItem(normalized),
      }),
    );

    console.info("[documents] DynamoDB write ok", { id, chunkCount });
    return normalized;
  } catch (error) {
    console.warn("[documents] DynamoDB write failed (session copy kept):", error);
    return normalized;
  }
}

export function documentStorageSource(id: string): "session" | "dynamodb" {
  return isDocumentInSession(id) ? "session" : "dynamodb";
}

export async function getDocumentContentBase64(docId: string, chunkCount: number) {
  try {
    const parts: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const result = await dynamodb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `${ENTITY_PREFIX.document}${docId}`,
            SK: `CHUNK#${String(i).padStart(4, "0")}`,
          },
        }),
      );
      if (!result.Item?.data) {
        return getDocumentSessionContent(docId);
      }
      parts.push(String(result.Item.data));
    }
    return parts.join("");
  } catch (error) {
    console.warn("getDocumentContentBase64 failed, session fallback:", error);
    return getDocumentSessionContent(docId);
  }
}

export async function deleteDocumentRecord(docId: string, chunkCount: number) {
  deleteDocumentSession(docId);

  const deletes = [
    dynamodb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `${ENTITY_PREFIX.document}${docId}`, SK: "METADATA" },
      }),
    ),
  ];

  for (let i = 0; i < chunkCount; i++) {
    deletes.push(
      dynamodb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `${ENTITY_PREFIX.document}${docId}`,
            SK: `CHUNK#${String(i).padStart(4, "0")}`,
          },
        }),
      ),
    );
  }

  try {
    await Promise.all(deletes);
  } catch (error) {
    console.warn("Document delete from DynamoDB failed (session removed):", error);
  }
}
