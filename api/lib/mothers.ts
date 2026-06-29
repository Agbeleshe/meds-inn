import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { RiskLevel, PatientStatus } from "../../src/types/clinical";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb";
import { motherListFilter, toMotherItem } from "./items";
import { PATIENTS } from "../../src/lib/demo-data";
import { withTimeout } from "./fast-fallback";
import {
  getMotherSession,
  getAllMotherSessions,
  saveMotherSession,
} from "./mother-session-store";

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
    riskLevel: (raw.riskLevel ?? "low") as RiskLevel,
    status: (raw.status ?? "new") as PatientStatus,
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
    assignedNurseUserId: raw.assignedNurseUserId ? String(raw.assignedNurseUserId) : null,
    assignedDoctorUserId: raw.assignedDoctorUserId ? String(raw.assignedDoctorUserId) : null,
    specialistRequestType: raw.specialistRequestType ? String(raw.specialistRequestType) : null,
    specialistRequestNote: raw.specialistRequestNote ? String(raw.specialistRequestNote) : null,
    specialistRequestAt: raw.specialistRequestAt ? String(raw.specialistRequestAt) : null,
    specialistRequestStatus: raw.specialistRequestStatus ? String(raw.specialistRequestStatus) : null,
    escalationNote: raw.escalationNote ? String(raw.escalationNote) : null,
    escalationSeverity: raw.escalationSeverity ? String(raw.escalationSeverity) : null,
    escalationAt: raw.escalationAt ? String(raw.escalationAt) : null,
    escalationBy: raw.escalationBy ? String(raw.escalationBy) : null,
    escalationByUserId: raw.escalationByUserId ? String(raw.escalationByUserId) : null,
    escalationStatus: raw.escalationStatus ? String(raw.escalationStatus) : null,
    escalationTargets: Array.isArray(raw.escalationTargets)
      ? (raw.escalationTargets as string[]).filter((t) =>
          ["doctor", "nurse", "admin"].includes(t),
        ) as ("doctor" | "nurse" | "admin")[]
      : undefined,
    videoCallRequestStatus: raw.videoCallRequestStatus
      ? (String(raw.videoCallRequestStatus) as "pending" | "scheduled")
      : null,
    videoCallRequestNote: raw.videoCallRequestNote ? String(raw.videoCallRequestNote) : null,
    videoCallRequestAt: raw.videoCallRequestAt ? String(raw.videoCallRequestAt) : null,
  };
}

/** Paginated scan — Limit alone misses mothers when table has many entity types */
export async function listMotherRecords(hospitalId?: string) {
  const mothers: ReturnType<typeof normalizeMotherRecord>[] = [];
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

function demoMotherList(hospitalId?: string) {
  return PATIENTS.map((p) =>
    normalizeMotherRecord({ ...p, hospitalId: hospitalId ?? "ELR" }),
  ).filter((m) => !hospitalId || m.hospitalId === hospitalId);
}

/** Resolved mothers with 2.5s cap — avoids blocking on slow DynamoDB scans. */
export async function listMotherRecordsFast(hospitalId?: string) {
  const demo = demoMotherList(hospitalId);
  const items = await withTimeout(
    listMotherRecordsResolved(hospitalId).catch(() => demo),
    2500,
    demo,
  );
  return items.length > 0 ? items : demo;
}

export function getDemoMotherById(motherId: string) {
  const demo = PATIENTS.find((p) => p.id === motherId);
  if (!demo) return null;
  return normalizeMotherRecord({ ...demo, hospitalId: "ELR" });
}

function backfillMotherFromDemo(normalized: ReturnType<typeof normalizeMotherRecord>) {
  const demo = getDemoMotherById(normalized.id);
  if (!demo) return normalized;
  return normalizeMotherRecord({
    ...demo,
    ...normalized,
    assignedNurseUserId:
      normalized.assignedNurseUserId ?? demo.assignedNurseUserId ?? null,
    assignedDoctorUserId:
      normalized.assignedDoctorUserId ?? demo.assignedDoctorUserId ?? null,
    nurse:
      normalized.nurse === "To be assigned" && demo.nurse !== "To be assigned"
        ? demo.nurse
        : normalized.nurse,
    doctor:
      normalized.doctor === "To be assigned" && demo.doctor !== "To be assigned"
        ? demo.doctor
        : normalized.doctor,
  });
}

function mergeMotherWithSession(base: Record<string, unknown>) {
  const session = getMotherSession(String(base.id));
  if (!session) return backfillMotherFromDemo(normalizeMotherRecord(base));
  return backfillMotherFromDemo(normalizeMotherRecord({ ...base, ...session }));
}

/** DB → demo fallback → session overrides (single source of truth for API reads). */
export async function getMotherRecordResolved(motherId: string) {
  let record: Record<string, unknown> | null = null;

  try {
    record = await getMotherRecordById(motherId);
  } catch (error) {
    console.warn("DynamoDB getMotherRecordById failed:", error);
  }

  if (!record) {
    const demo = getDemoMotherById(motherId);
    record = demo ? (demo as unknown as Record<string, unknown>) : null;
  }

  const sessionOnly = getMotherSession(motherId);
  if (record) return mergeMotherWithSession(record);
  if (sessionOnly) return backfillMotherFromDemo(normalizeMotherRecord(sessionOnly));
  return null;
}

/** List mothers with demo + session merge when DB is empty or unavailable. */
export async function listMotherRecordsResolved(hospitalId?: string) {
  const byId = new Map<string, ReturnType<typeof normalizeMotherRecord>>();

  try {
    const fromDb = await listMotherRecords(hospitalId);
    for (const m of fromDb) byId.set(m.id, m);
  } catch (error) {
    console.warn("DynamoDB listMotherRecords failed:", error);
  }

  if (byId.size === 0) {
    for (const p of PATIENTS) {
      const m = normalizeMotherRecord({ ...p, hospitalId: "ELR" });
      if (!hospitalId || m.hospitalId === hospitalId) byId.set(m.id, m);
    }
  }

  for (const [id, session] of getAllMotherSessions()) {
    const base = byId.get(id) ?? getDemoMotherById(id);
    if (base) {
      byId.set(id, mergeMotherWithSession({ ...base, ...session }));
    } else if (session.id) {
      byId.set(id, normalizeMotherRecord(session));
    }
  }

  for (const [id, m] of byId) {
    byId.set(id, backfillMotherFromDemo(m));
  }

  return Array.from(byId.values());
}

/** Persist to DynamoDB when possible; always update session store. */
export async function putMotherRecordResolved(record: Record<string, unknown>) {
  const normalized = normalizeMotherRecord(record);
  saveMotherSession(normalized as unknown as Record<string, unknown>);
  try {
    await putMotherRecord(normalized as unknown as Record<string, unknown>);
    return true;
  } catch (error) {
    console.warn("DynamoDB putMotherRecord failed:", error);
    return false;
  }
}
