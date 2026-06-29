import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb";
import { toSymptomItem } from "./items";
import { listSymptomSessions, saveSymptomSession } from "./symptom-session-store";

export type SymptomSeverity = "mild" | "moderate" | "severe";

export function normalizeSymptom(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    date: String(raw.date ?? ""),
    symptom: String(raw.symptom ?? ""),
    severity: (String(raw.severity ?? "mild") as SymptomSeverity),
    notes: String(raw.notes ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    recordedAt: String(raw.recordedAt ?? new Date().toISOString()),
    recordedBy: String(raw.recordedBy ?? ""),
    recordedByUserId: String(raw.recordedByUserId ?? ""),
    recordedByRole: String(raw.recordedByRole ?? ""),
  };
}

export async function listSymptomRecords(patientId: string, from?: string, to?: string) {
  const sessionItems = listSymptomSessions(patientId).map((r) =>
    normalizeSymptom(r),
  );

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${patientId}`,
          ":prefix": "SYMPTOM#",
        },
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeSymptom(stripKeys(item as Record<string, unknown>)),
    );
    const byId = new Map<string, ReturnType<typeof normalizeSymptom>>();
    for (const item of fromDb) byId.set(item.id, item);
    for (const item of sessionItems) byId.set(item.id, item);
    let items = [...byId.values()];
    if (from) items = items.filter((s) => s.date >= from);
    if (to) items = items.filter((s) => s.date <= to);
    return items.sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt));
  } catch (error) {
    console.warn("Symptom query failed, session fallback:", error);
    let items = sessionItems;
    if (from) items = items.filter((s) => s.date >= from);
    if (to) items = items.filter((s) => s.date <= to);
    return items.sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt));
  }
}

export async function putSymptomRecord(record: Record<string, unknown>, patientId: string) {
  const normalized = normalizeSymptom({ ...record, patientId });
  saveSymptomSession(normalized);
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toSymptomItem(normalized, patientId),
      }),
    );
  } catch (error) {
    console.warn("Symptom put failed, session only:", error);
  }
  return normalized;
}
