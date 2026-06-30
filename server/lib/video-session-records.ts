import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb.js";
import { toVideoSessionItem } from "./items.js";
import {
  getVideoSessionSession,
  saveVideoSessionSession,
} from "./video-session-session-store.js";

export function normalizeVideoSession(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? raw.appointmentId ?? ""),
    appointmentId: String(raw.appointmentId ?? ""),
    patientId: String(raw.patientId ?? ""),
    transcript: String(raw.transcript ?? ""),
    structuredNotes: String(raw.structuredNotes ?? ""),
    clinicianName: String(raw.clinicianName ?? ""),
    appointmentType: String(raw.appointmentType ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    recordedByUserId: String(raw.recordedByUserId ?? ""),
    recordedByName: String(raw.recordedByName ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    completedAt: String(raw.completedAt ?? new Date().toISOString()),
  };
}

export async function getVideoSessionRecord(appointmentId: string, patientId: string) {
  const session = getVideoSessionSession(appointmentId);
  if (session) return normalizeVideoSession(session);

  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `${ENTITY_PREFIX.mother}${patientId}`,
          [SORT_KEY]: `VIDEOSESSION#${appointmentId}`,
        },
      }),
    );
    if (!result.Item) return null;
    return normalizeVideoSession(stripKeys(result.Item as Record<string, unknown>));
  } catch (error) {
    console.warn("Video session get failed:", error);
    return null;
  }
}

export async function listVideoSessionsForPatient(patientId: string) {
  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${patientId}`,
          ":prefix": "VIDEOSESSION#",
        },
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeVideoSession(stripKeys(item as Record<string, unknown>)),
    );
    const byAppt = new Map<string, ReturnType<typeof normalizeVideoSession>>();
    for (const item of fromDb) byAppt.set(item.appointmentId, item);
    return [...byAppt.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  } catch (error) {
    console.warn("Video session list failed:", error);
    return [];
  }
}

export async function putVideoSessionRecord(record: Record<string, unknown>, patientId: string) {
  const normalized = normalizeVideoSession({ ...record, patientId });
  saveVideoSessionSession(normalized.appointmentId, normalized);
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toVideoSessionItem(normalized, patientId),
      }),
    );
  } catch (error) {
    console.warn("Video session put failed, session only:", error);
  }
  return normalized;
}
