import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb";
import { motherListFilter, toMotherItem } from "./items";

export async function getMotherRecordById(motherId: string) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PARTITION_KEY]: `${ENTITY_PREFIX.mother}${motherId}`,
        [SORT_KEY]: "PROFILE",
      },
    }),
  );

  if (!result.Item) return null;
  return stripKeys(result.Item as Record<string, unknown>);
}

export async function putMotherRecord(record: Record<string, unknown>) {
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: toMotherItem(record),
    }),
  );
}

export function trimesterFromWeeks(weeks: number) {
  if (weeks <= 0) return "Enrolled";
  if (weeks <= 13) return "First";
  if (weeks <= 27) return "Second";
  return "Third";
}

/** Normalize raw DynamoDB/demo rows into the shape MothersPage expects */
export function normalizeMotherRecord(raw: Record<string, unknown>) {
  const concerns = raw.concerns;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Unknown"),
    initials: String(raw.initials ?? "??"),
    age: Number(raw.age ?? 0),
    gestationalWeek: Number(raw.gestationalWeek ?? raw.gestationalWeeks ?? 0),
    trimester: String(raw.trimester ?? "Enrolled"),
    riskLevel: raw.riskLevel ?? "low",
    status: raw.status ?? "new",
    nurse: String(raw.nurse ?? "To be assigned"),
    doctor: String(raw.doctor ?? "To be assigned"),
    lastCheckIn: String(raw.lastCheckIn ?? ""),
    nextAppointment: String(raw.nextAppointment ?? ""),
    adherence: Number(raw.adherence ?? 100),
    edd: String(raw.edd ?? ""),
    bloodGroup: String(raw.bloodGroup ?? ""),
    allergies: String(raw.allergies ?? "None"),
    phone: String(raw.phone ?? ""),
    concerns: Array.isArray(concerns) ? concerns.map(String) : [],
    emergencyContact: String(raw.emergencyContact ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    onboardingComplete: raw.onboardingComplete,
    careStage: raw.careStage,
    babyWeeks: raw.babyWeeks,
  };
}

/** Paginated scan — Limit alone misses mothers when table has many entity types */
export async function listMotherRecords(hospitalId?: string) {
  const mothers: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ...motherListFilter(),
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of result.Items ?? []) {
      const record = normalizeMotherRecord(stripKeys(item as Record<string, unknown>));
      if (!record.id || !record.name) continue;
      if (hospitalId && record.hospitalId !== hospitalId) continue;
      mothers.push(record);
    }

    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return mothers;
}
