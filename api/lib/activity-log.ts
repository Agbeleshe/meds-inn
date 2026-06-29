import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb";
import { toActivityItem } from "./items";

export type ActivityCategory =
  | "appointment"
  | "video-call"
  | "symptom"
  | "clinical-note"
  | "lab-result"
  | "escalation"
  | "care-brief";

export interface ActivityEntry {
  id: string;
  hospitalId: string;
  category: ActivityCategory;
  action: string;
  detail: string;
  actorName: string;
  actorUserId: string;
  actorRole: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  createdAt: string;
}

const sessionLog: ActivityEntry[] = [];
const MAX_SESSION = 200;

export function normalizeActivity(raw: Record<string, unknown>): ActivityEntry {
  return {
    id: String(raw.id ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    category: String(raw.category ?? "appointment") as ActivityCategory,
    action: String(raw.action ?? ""),
    detail: String(raw.detail ?? ""),
    actorName: String(raw.actorName ?? ""),
    actorUserId: String(raw.actorUserId ?? ""),
    actorRole: String(raw.actorRole ?? ""),
    patientId: raw.patientId ? String(raw.patientId) : undefined,
    patientName: raw.patientName ? String(raw.patientName) : undefined,
    appointmentId: raw.appointmentId ? String(raw.appointmentId) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export async function logActivity(input: Omit<ActivityEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const entry = normalizeActivity({
    ...input,
    id: input.id ?? `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });

  sessionLog.unshift(entry);
  if (sessionLog.length > MAX_SESSION) sessionLog.pop();

  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toActivityItem(entry),
      }),
    );
  } catch (error) {
    console.warn("Activity log put failed, session only:", error);
  }

  return entry;
}

export async function listActivityLog(hospitalId: string, limit = 50) {
  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.hospital}${hospitalId}`,
          ":prefix": "ACTIVITY#",
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeActivity(stripKeys(item as Record<string, unknown>)),
    );
    if (fromDb.length > 0) return fromDb;
  } catch (error) {
    console.warn("Activity log query failed:", error);
  }

  return sessionLog
    .filter((e) => e.hospitalId === hospitalId)
    .slice(0, limit);
}
