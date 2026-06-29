import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb.js";
import { toClinicalNoteItem } from "./items.js";
import { listClinicalNoteSessions, saveClinicalNoteSession } from "./clinical-note-session-store.js";

export function normalizeClinicalNote(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    date: String(raw.date ?? ""),
    note: String(raw.note ?? ""),
    authorName: String(raw.authorName ?? ""),
    authorUserId: String(raw.authorUserId ?? ""),
    authorRole: String(raw.authorRole ?? ""),
    category: String(raw.category ?? "visit"),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export async function listClinicalNoteRecords(patientId: string) {
  const sessionItems = listClinicalNoteSessions(patientId).map((r) =>
    normalizeClinicalNote(r),
  );

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${patientId}`,
          ":prefix": "CLINNOTE#",
        },
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeClinicalNote(stripKeys(item as Record<string, unknown>)),
    );
    const byId = new Map<string, ReturnType<typeof normalizeClinicalNote>>();
    for (const item of fromDb) byId.set(item.id, item);
    for (const item of sessionItems) byId.set(item.id, item);
    return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn("Clinical note query failed:", error);
    return sessionItems.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export async function putClinicalNoteRecord(record: Record<string, unknown>, patientId: string) {
  const normalized = normalizeClinicalNote({ ...record, patientId });
  saveClinicalNoteSession(normalized);
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toClinicalNoteItem(normalized, patientId),
      }),
    );
  } catch (error) {
    console.warn("Clinical note put failed, session only:", error);
  }
  return normalized;
}
