import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb.js";
import { toLabItem } from "./items.js";
import { LAB_RESULTS } from "../../src/lib/demo-data.js";
import { listLabSessions, saveLabSession } from "./lab-session-store.js";

export function normalizeLab(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    test: String(raw.test ?? ""),
    date: String(raw.date ?? ""),
    result: String(raw.result ?? ""),
    status: String(raw.status ?? "Recorded"),
    flag: (String(raw.flag ?? "normal") as "normal" | "mild-concern" | "concern"),
    notes: String(raw.notes ?? ""),
    orderedBy: String(raw.orderedBy ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export async function listLabRecords(patientId: string) {
  const sessionItems = listLabSessions(patientId).map((r) => normalizeLab(r));

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${patientId}`,
          ":prefix": "LAB#",
        },
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeLab(stripKeys(item as Record<string, unknown>)),
    );
    const byId = new Map<string, ReturnType<typeof normalizeLab>>();
    for (const item of fromDb) byId.set(item.id, item);
    for (const item of sessionItems) byId.set(item.id, item);
    if (byId.size === 0) {
      for (const lab of (LAB_RESULTS as unknown as Record<string, unknown>[]).filter((l) => l.patientId === patientId)) {
        byId.set(String(lab.id), normalizeLab(lab));
      }
    }
    return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.warn("Lab query failed:", error);
    if (sessionItems.length > 0) return sessionItems.sort((a, b) => b.date.localeCompare(a.date));
    return (LAB_RESULTS as unknown as Record<string, unknown>[]).filter((l) => l.patientId === patientId)
      .map((l) => normalizeLab(l))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}

export async function putLabRecord(record: Record<string, unknown>, patientId: string) {
  const normalized = normalizeLab({ ...record, patientId });
  saveLabSession(normalized);
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toLabItem(normalized, patientId),
      }),
    );
  } catch (error) {
    console.warn("Lab put failed, session only:", error);
  }
  return normalized;
}
