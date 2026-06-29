import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, PARTITION_KEY, SORT_KEY, stripKeys } from "./dynamodb";

export function normalizeBabyProfile(raw: Record<string, unknown>, motherId: string) {
  return {
    motherId,
    babyName: String(raw.babyName ?? ""),
    birthDate: String(raw.birthDate ?? ""),
    birthWeight: String(raw.birthWeight ?? ""),
    currentWeight: String(raw.currentWeight ?? ""),
    birthLength: String(raw.birthLength ?? ""),
    deliveryType: String(raw.deliveryType ?? ""),
    feedingMethod: String(raw.feedingMethod ?? ""),
    bloodGroup: String(raw.bloodGroup ?? ""),
    gender: String(raw.gender ?? ""),
    apgarScore: String(raw.apgarScore ?? ""),
    notes: String(raw.notes ?? ""),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function getBabyProfileRecord(motherId: string) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: "BABY#PROFILE",
      },
    }),
  );
  if (!result.Item) return null;
  return normalizeBabyProfile(stripKeys(result.Item as Record<string, unknown>), motherId);
}

export function normalizeBabySymptom(raw: Record<string, unknown>, motherId: string) {
  return {
    id: String(raw.id ?? ""),
    motherId,
    date: String(raw.date ?? ""),
    symptom: String(raw.symptom ?? ""),
    severity: String(raw.severity ?? "mild") as "mild" | "moderate" | "severe",
    notes: String(raw.notes ?? ""),
    recordedAt: String(raw.recordedAt ?? new Date().toISOString()),
  };
}

export async function listBabySymptomRecords(motherId: string) {
  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${motherId}`,
          ":prefix": "BABY#SYMPTOM#",
        },
      }),
    );
    return (result.Items ?? [])
      .map((item) => normalizeBabySymptom(stripKeys(item as Record<string, unknown>), motherId))
      .sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt));
  } catch {
    return [];
  }
}

export async function putBabySymptomRecord(record: Record<string, unknown>, motherId: string) {
  const id = String(record.id ?? `bs-${Date.now()}`);
  const normalized = normalizeBabySymptom({ ...record, id }, motherId);
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: `BABY#SYMPTOM#${id}`,
        entityType: "BABY_SYMPTOM",
        ...normalized,
      },
    }),
  );
  return normalized;
}

export function normalizeBabyMedication(raw: Record<string, unknown>, motherId: string) {
  return {
    id: String(raw.id ?? ""),
    motherId,
    name: String(raw.name ?? ""),
    dosage: String(raw.dosage ?? ""),
    frequency: String(raw.frequency ?? ""),
    instructions: String(raw.instructions ?? ""),
    active: raw.active !== false,
    adherence: Number(raw.adherence ?? 100),
    prescribedBy: String(raw.prescribedBy ?? ""),
    startDate: String(raw.startDate ?? ""),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function listBabyMedicationRecords(motherId: string) {
  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${motherId}`,
          ":prefix": "BABY#MED#",
        },
      }),
    );
    return (result.Items ?? [])
      .map((item) => normalizeBabyMedication(stripKeys(item as Record<string, unknown>), motherId))
      .filter((m) => m.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function putBabyMedicationRecord(record: Record<string, unknown>, motherId: string) {
  const id = String(record.id ?? `bm-${Date.now()}`);
  const normalized = normalizeBabyMedication({ ...record, id }, motherId);
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: `BABY#MED#${id}`,
        entityType: "BABY_MEDICATION",
        ...normalized,
      },
    }),
  );
  return normalized;
}

export const DEFAULT_BABY_CHECKLIST_ITEMS = [
  { id: "bt1", text: "Morning feed / breastfeeding session logged" },
  { id: "bt2", text: "Vitamin D drops given (if prescribed)" },
  { id: "bt3", text: "Baby medication dose given (if prescribed)" },
  { id: "bt4", text: "Diaper change & skin check completed" },
  { id: "bt5", text: "Tummy time (3–5 minutes while awake)" },
  { id: "bt6", text: "Afternoon feed logged" },
  { id: "bt7", text: "Evening bath or sponge bath (as advised)" },
  { id: "bt8", text: "Bedtime feed & safe sleep routine" },
];

export function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getBabyChecklistDay(motherId: string, date = localDateString()) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: `BABY#CHECKLISTDAY#${date}`,
      },
    }),
  );
  if (!result.Item) {
    return {
      motherId,
      date,
      completedItemIds: [] as string[],
      items: DEFAULT_BABY_CHECKLIST_ITEMS,
    };
  }
  const raw = stripKeys(result.Item as Record<string, unknown>);
  return {
    motherId,
    date,
    completedItemIds: (raw.completedItemIds as string[]) ?? [],
    items: DEFAULT_BABY_CHECKLIST_ITEMS,
  };
}

export async function toggleBabyChecklistItem(motherId: string, itemId: string, date = localDateString()) {
  const day = await getBabyChecklistDay(motherId, date);
  const has = day.completedItemIds.includes(itemId);
  const completedItemIds = has
    ? day.completedItemIds.filter((id) => id !== itemId)
    : [...day.completedItemIds, itemId];
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: `BABY#CHECKLISTDAY#${date}`,
        entityType: "BABY_CHECKLIST_DAY",
        motherId,
        date,
        completedItemIds,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
  return { ...day, completedItemIds };
}

export function babyWeeksFromBirthDate(birthDate: string) {
  if (!birthDate) return 0;
  const birth = new Date(`${birthDate}T12:00:00`);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  return Math.max(0, Math.min(52, Math.floor(diff / (7 * 24 * 60 * 60 * 1000))));
}
