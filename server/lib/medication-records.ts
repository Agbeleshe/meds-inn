import { GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb";
import { prefixFilter, toMedicationDoseItem, toMedicationItem } from "./items";
import { withTimeout } from "./fast-fallback";
import { MEDICATIONS } from "../../src/lib/demo-data";

export function defaultScheduleTimes(frequency: string): string[] {
  const f = frequency.toLowerCase();
  if (f.includes("twice")) return ["08:00", "20:00"];
  if (f.includes("three") || f.includes("3")) return ["08:00", "14:00", "20:00"];
  return ["07:30"];
}

export function normalizeMedication(raw: Record<string, unknown>) {
  const frequency = String(raw.frequency ?? "Once daily");
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    name: String(raw.name ?? ""),
    dosage: String(raw.dosage ?? ""),
    frequency,
    route: String(raw.route ?? "Oral"),
    instructions: String(raw.instructions ?? ""),
    startDate: String(raw.startDate ?? ""),
    endDate: String(raw.endDate ?? ""),
    prescribedBy: String(raw.prescribedBy ?? ""),
    prescribedByUserId: raw.prescribedByUserId ? String(raw.prescribedByUserId) : undefined,
    scheduleTimes: Array.isArray(raw.scheduleTimes)
      ? raw.scheduleTimes.map(String)
      : defaultScheduleTimes(frequency),
    adherence: Number(raw.adherence ?? 100),
    missedDoses: Number(raw.missedDoses ?? 0),
    lastTaken: String(raw.lastTaken ?? ""),
    notes: String(raw.notes ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    active: raw.active !== false,
  };
}

export async function listMedicationRecords(hospitalId?: string) {
  const demoItems = () => {
    let items = MEDICATIONS.map((m) =>
      normalizeMedication(m as unknown as Record<string, unknown>),
    );
    if (hospitalId) items = items.filter((m) => m.hospitalId === hospitalId);
    return items;
  };

  try {
    const result = await withTimeout(
      dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 200,
          ...prefixFilter(ENTITY_PREFIX.medication),
        }),
      ),
      2500,
      { Items: [] } as any,
    );
    let items = (result.Items ?? []).map((item) =>
      normalizeMedication(stripKeys(item as Record<string, unknown>)),
    );
    if (hospitalId) {
      items = items.filter((m) => m.hospitalId === hospitalId);
    }
    if (items.length === 0) return demoItems();
    return items;
  } catch (error) {
    console.warn("Medication scan failed, demo fallback:", error);
    return demoItems();
  }
}

export async function getMedicationRecordById(id: string) {
  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `${ENTITY_PREFIX.medication}${id}`,
          [SORT_KEY]: "METADATA",
        },
      }),
    );
    if (!result.Item) return null;
    return normalizeMedication(stripKeys(result.Item as Record<string, unknown>));
  } catch {
    const demo = MEDICATIONS.find((m) => m.id === id);
    return demo ? normalizeMedication(demo as unknown as Record<string, unknown>) : null;
  }
}

export async function putMedicationRecord(record: Record<string, unknown>) {
  const normalized = normalizeMedication(record);
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: toMedicationItem(normalized),
    }),
  );
  return normalized;
}

export async function listDoseRecords(patientId: string, from?: string, to?: string) {
  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${patientId}`,
          ":prefix": "MEDDOSE#",
        },
      }),
    );
    let items = (result.Items ?? []).map((item) => stripKeys(item as Record<string, unknown>));
    if (from) items = items.filter((d) => String(d.date) >= from);
    if (to) items = items.filter((d) => String(d.date) <= to);
    return items;
  } catch (error) {
    console.warn("Dose query failed:", error);
    return [];
  }
}

export async function putDoseRecord(dose: Record<string, unknown>, patientId: string) {
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: toMedicationDoseItem(dose, patientId),
    }),
  );
  return dose;
}

function dateRangeDays(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function computeAdherenceStats(
  medication: ReturnType<typeof normalizeMedication>,
  doses: Record<string, unknown>[],
  today = new Date().toISOString().slice(0, 10),
) {
  const medDoses = doses.filter((d) => String(d.medicationId) === medication.id);
  const end = medication.endDate < today ? medication.endDate : today;
  if (end < medication.startDate) {
    return { adherence: 100, missedDoses: 0, lastTaken: medication.lastTaken };
  }

  const days = dateRangeDays(medication.startDate, end);
  const times = medication.scheduleTimes ?? defaultScheduleTimes(medication.frequency);
  let expected = 0;
  let taken = 0;
  let missed = 0;
  let lastTaken = medication.lastTaken;

  for (const day of days) {
    for (const time of times) {
      expected += 1;
      const doseId = `${medication.id}-${day}-${time}`;
      const stored =
        medDoses.find((d) => String(d.id) === doseId) ??
        medDoses.find((d) => String(d.date) === day && String(d.scheduledTime) === time);

      const status = stored ? String(stored.status) : day < today || (day === today && time < new Date().toTimeString().slice(0, 5) ? "missed" : "pending");

      if (status === "taken") {
        taken += 1;
        if (stored?.recordedAt) lastTaken = String(stored.recordedAt);
        else lastTaken = `${day}T${time}:00`;
      } else if (status === "missed" || status === "skipped") {
        missed += 1;
      }
    }
  }

  const completed = taken + missed;
  const adherence = completed > 0 ? Math.round((taken / completed) * 100) : 100;

  return { adherence, missedDoses: missed, lastTaken };
}

export function buildTodayDoses(
  medications: ReturnType<typeof normalizeMedication>[],
  storedDoses: Record<string, unknown>[],
  today = new Date().toISOString().slice(0, 10),
) {
  const results: Record<string, unknown>[] = [];

  for (const med of medications) {
    if (!med.active || today < med.startDate || today > med.endDate) continue;
    const times = med.scheduleTimes ?? defaultScheduleTimes(med.frequency);

    for (const time of times) {
      const id = `${med.id}-${today}-${time}`;
      const stored = storedDoses.find((d) => String(d.id) === id);
      results.push(
        stored ?? {
          id,
          medicationId: med.id,
          patientId: med.patientId,
          medicationName: med.name,
          dosage: med.dosage,
          date: today,
          scheduledTime: time,
          status: "pending",
        },
      );
    }
  }

  return results.sort((a, b) => String(a.scheduledTime).localeCompare(String(b.scheduledTime)));
}

export function buildDoseHistory(
  medications: ReturnType<typeof normalizeMedication>[],
  storedDoses: Record<string, unknown>[],
  from: string,
  to: string,
  today = new Date().toISOString().slice(0, 10),
) {
  const history: Record<string, unknown>[] = [];
  const days = dateRangeDays(from, to);

  for (const med of medications) {
    if (!med.active) continue;
    const times = med.scheduleTimes ?? defaultScheduleTimes(med.frequency);

    for (const day of days) {
      if (day < med.startDate || day > med.endDate) continue;
      for (const time of times) {
        const id = `${med.id}-${day}-${time}`;
        const stored = storedDoses.find((d) => String(d.id) === id);
        let status = stored ? String(stored.status) : "pending";
        if (!stored && day < today) status = "missed";
        if (!stored && day === today && time < new Date().toTimeString().slice(0, 5)) {
          status = "missed";
        }

        history.push(
          stored ?? {
            id,
            medicationId: med.id,
            patientId: med.patientId,
            medicationName: med.name,
            dosage: med.dosage,
            date: day,
            scheduledTime: time,
            status,
          },
        );
      }
    }
  }

  return history.sort((a, b) => {
    const da = `${a.date}T${a.scheduledTime}`;
    const db = `${b.date}T${b.scheduledTime}`;
    return db.localeCompare(da);
  });
}
