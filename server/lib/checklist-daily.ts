import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  ENTITY_PREFIX,
  PARTITION_KEY,
  SORT_KEY,
  stripKeys,
} from "./dynamodb.js";
import {
  clearChecklistDaySessions,
  getChecklistDaySession,
  listChecklistDaySessions,
  saveChecklistDaySession,
} from "./checklist-session-store.js";

export interface DailyChecklistItem {
  id: string;
  text: string;
}

export interface DailyChecklistAssignment {
  items: DailyChecklistItem[];
  startDate: string;
  durationDays: number;
  endDate: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  lastFinalizedDate?: string;
}

export interface ChecklistDayRecord {
  motherId: string;
  date: string;
  completedItemIds: string[];
  abscondedItemIds: string[];
  finalized: boolean;
  finalizedAt?: string;
}

export interface ChecklistDaySummary {
  date: string;
  completedCount: number;
  abscondedCount: number;
  totalCount: number;
  abscondedItems: { id: string; text: string }[];
  completed: boolean;
}

export interface ChecklistAdherenceStats {
  totalDays: number;
  daysTracked: number;
  totalTasksPossible: number;
  totalTasksCompleted: number;
  totalAbsconded: number;
  adherencePercent: number;
  daySummaries: ChecklistDaySummary[];
}

export function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

function daysBetween(start: string, end: string) {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function computeEndDate(startDate: string, durationDays: number) {
  return addDays(startDate, Math.max(1, durationDays) - 1);
}

export function isAssignmentActive(assignment: DailyChecklistAssignment, date = localDateString()) {
  return date >= assignment.startDate && date <= assignment.endDate;
}

function toDayItem(record: ChecklistDayRecord) {
  return {
    [PARTITION_KEY]: `${ENTITY_PREFIX.mother}${record.motherId}`,
    [SORT_KEY]: `CHECKLISTDAY#${record.date}`,
    entityType: "CHECKLISTDAY",
    ...record,
  };
}

export async function getChecklistDayRecord(motherId: string, date: string) {
  const session = getChecklistDaySession(motherId, date);
  if (session) return normalizeDayRecord(session);

  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          [PARTITION_KEY]: `${ENTITY_PREFIX.mother}${motherId}`,
          [SORT_KEY]: `CHECKLISTDAY#${date}`,
        },
      }),
    );
    if (result.Item) return normalizeDayRecord(stripKeys(result.Item as Record<string, unknown>));
  } catch (error) {
    console.warn("DynamoDB getChecklistDayRecord failed:", error);
  }
  return null;
}

export async function putChecklistDayRecord(record: ChecklistDayRecord) {
  const normalized = normalizeDayRecord(record as unknown as Record<string, unknown>);
  saveChecklistDaySession(normalized.motherId, normalized as unknown as Record<string, unknown>);

  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toDayItem(normalized) as unknown as Record<string, unknown>,
      }),
    );
  } catch (error) {
    console.warn("DynamoDB putChecklistDayRecord failed, kept in session:", error);
  }
  return normalized;
}

function normalizeDayRecord(raw: Record<string, unknown>): ChecklistDayRecord {
  return {
    motherId: String(raw.motherId ?? ""),
    date: String(raw.date ?? ""),
    completedItemIds: Array.isArray(raw.completedItemIds)
      ? raw.completedItemIds.map(String)
      : [],
    abscondedItemIds: Array.isArray(raw.abscondedItemIds)
      ? raw.abscondedItemIds.map(String)
      : [],
    finalized: raw.finalized === true,
    finalizedAt: raw.finalizedAt ? String(raw.finalizedAt) : undefined,
  };
}

async function listChecklistDayRecords(motherId: string) {
  const sessionItems = listChecklistDaySessions(motherId).map(normalizeDayRecord);

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": PARTITION_KEY, "#sk": SORT_KEY },
        ExpressionAttributeValues: {
          ":pk": `${ENTITY_PREFIX.mother}${motherId}`,
          ":prefix": "CHECKLISTDAY#",
        },
      }),
    );
    const fromDb = (result.Items ?? []).map((item) =>
      normalizeDayRecord(stripKeys(item as Record<string, unknown>)),
    );
    const byDate = new Map<string, ChecklistDayRecord>();
    for (const r of [...fromDb, ...sessionItems]) {
      byDate.set(r.date, r);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.warn("DynamoDB listChecklistDayRecords failed:", error);
    return sessionItems.sort((a, b) => a.date.localeCompare(b.date));
  }
}

async function finalizeDay(
  motherId: string,
  date: string,
  templateItemIds: string[],
  templateItems: DailyChecklistItem[],
) {
  let record = await getChecklistDayRecord(motherId, date);
  if (!record) {
    record = {
      motherId,
      date,
      completedItemIds: [],
      abscondedItemIds: [],
      finalized: false,
    };
  }
  if (record.finalized) return record;

  const abscondedItemIds = templateItemIds.filter(
    (id) => !record!.completedItemIds.includes(id),
  );
  record = {
    ...record,
    abscondedItemIds,
    finalized: true,
    finalizedAt: new Date().toISOString(),
  };
  return putChecklistDayRecord(record);
}

/** Finalize past days and return today's live checklist state. */
export async function processDailyChecklist(
  motherId: string,
  assignment: DailyChecklistAssignment | null | undefined,
): Promise<{
  motherChecklist: {
    id: string;
    text: string;
    done: boolean;
    setBy: string;
    setAt: string;
  }[];
  todayDate: string;
  yesterdayDate: string;
  yesterdaySummary: ChecklistDaySummary | null;
  assignmentActive: boolean;
  adherence: ChecklistAdherenceStats | null;
  updatedAssignment: DailyChecklistAssignment | null;
}> {
  const today = localDateString();
  const empty = {
    motherChecklist: [],
    todayDate: today,
    yesterdayDate: addDays(today, -1),
    yesterdaySummary: null,
    assignmentActive: false,
    adherence: null,
    updatedAssignment: assignment ?? null,
  };

  if (!assignment || !assignment.items?.length) return empty;

  const templateIds = assignment.items.map((i) => i.id);
  let updatedAssignment = { ...assignment };

  const yesterday = addDays(today, -1);
  const lastFinalized = assignment.lastFinalizedDate ?? addDays(assignment.startDate, -1);

  if (lastFinalized < yesterday) {
    const finalizeFrom = addDays(lastFinalized, 1);
    const finalizeTo = yesterday < assignment.endDate ? yesterday : assignment.endDate;
    if (finalizeFrom <= finalizeTo && finalizeFrom >= assignment.startDate) {
      for (const date of daysBetween(finalizeFrom, finalizeTo)) {
        if (date >= assignment.startDate && date <= assignment.endDate) {
          await finalizeDay(motherId, date, templateIds, assignment.items);
        }
      }
      updatedAssignment = {
        ...updatedAssignment,
        lastFinalizedDate: finalizeTo >= assignment.startDate ? finalizeTo : lastFinalized,
      };
    }
  }

  let todayRecord = await getChecklistDayRecord(motherId, today);
  if (!todayRecord && isAssignmentActive(assignment, today)) {
    todayRecord = {
      motherId,
      date: today,
      completedItemIds: [],
      abscondedItemIds: [],
      finalized: false,
    };
    await putChecklistDayRecord(todayRecord);
  }

  const active = isAssignmentActive(assignment, today);
  const motherChecklist = active
    ? assignment.items.map((item) => ({
        id: item.id,
        text: item.text,
        done: todayRecord?.completedItemIds.includes(item.id) ?? false,
        setBy: assignment.createdByName ?? "Care team",
        setAt: today,
      }))
    : [];

  const allRecords = await listChecklistDayRecords(motherId);
  const trackedDates = daysBetween(assignment.startDate, assignment.endDate).filter(
    (d) => d <= yesterday || (d === today && todayRecord?.finalized),
  );

  const daySummaries: ChecklistDaySummary[] = [];
  for (const date of daysBetween(assignment.startDate, assignment.endDate)) {
    if (date > today) break;
    const rec =
      allRecords.find((r) => r.date === date) ??
      (date === today ? todayRecord : null);
    if (!rec && date === today && active) {
      daySummaries.push({
        date,
        completedCount: 0,
        abscondedCount: 0,
        totalCount: templateIds.length,
        abscondedItems: [],
        completed: false,
      });
      continue;
    }
    if (!rec) continue;

    const abscondedItems = assignment.items.filter((i) =>
      rec.abscondedItemIds.includes(i.id),
    );
    daySummaries.push({
      date,
      completedCount: rec.completedItemIds.length,
      abscondedCount: rec.abscondedItemIds.length,
      totalCount: templateIds.length,
      abscondedItems,
      completed: rec.finalized
        ? rec.abscondedItemIds.length === 0 && rec.completedItemIds.length === templateIds.length
        : rec.completedItemIds.length === templateIds.length,
    });
  }

  const finalizedDays = daySummaries.filter((d) => {
    const rec = allRecords.find((r) => r.date === d.date);
    return rec?.finalized || d.date < today;
  });

  const totalTasksPossible = finalizedDays.length * templateIds.length;
  const totalTasksCompleted = finalizedDays.reduce((s, d) => s + d.completedCount, 0);
  const totalAbsconded = finalizedDays.reduce((s, d) => s + d.abscondedCount, 0);

  const adherence: ChecklistAdherenceStats = {
    totalDays: assignment.durationDays,
    daysTracked: finalizedDays.length,
    totalTasksPossible,
    totalTasksCompleted,
    totalAbsconded,
    adherencePercent:
      totalTasksPossible > 0
        ? Math.round((totalTasksCompleted / totalTasksPossible) * 100)
        : 100,
    daySummaries,
  };

  return {
    motherChecklist,
    todayDate: today,
    yesterdayDate: addDays(today, -1),
    yesterdaySummary:
      adherence?.daySummaries.find((d) => d.date === addDays(today, -1)) ?? null,
    assignmentActive: active,
    adherence,
    updatedAssignment,
  };
}

export async function toggleDailyChecklistItem(
  motherId: string,
  assignment: DailyChecklistAssignment,
  itemId: string,
) {
  const today = localDateString();
  if (!isAssignmentActive(assignment, today)) {
    throw new Error("Checklist is not active today");
  }

  let record = await getChecklistDayRecord(motherId, today);
  if (!record) {
    record = {
      motherId,
      date: today,
      completedItemIds: [],
      abscondedItemIds: [],
      finalized: false,
    };
  }
  if (record.finalized) {
    throw new Error("Today's checklist is already closed");
  }

  const has = record.completedItemIds.includes(itemId);
  const completedItemIds = has
    ? record.completedItemIds.filter((id) => id !== itemId)
    : [...record.completedItemIds, itemId];

  return putChecklistDayRecord({ ...record, completedItemIds });
}

export function buildDailyChecklistAssignment(input: {
  items: { id?: string; text: string }[];
  durationDays: number;
  startDate?: string;
  createdBy: string;
  createdByName?: string;
}): DailyChecklistAssignment {
  const startDate = input.startDate ?? localDateString();
  const durationDays = Math.max(1, Math.min(365, Number(input.durationDays) || 7));
  const items = input.items
    .map((item, idx) => ({
      id: item.id ?? `cli-${Date.now()}-${idx}`,
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0);

  return {
    items,
    startDate,
    durationDays,
    endDate: computeEndDate(startDate, durationDays),
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: new Date().toISOString(),
    lastFinalizedDate: addDays(startDate, -1),
  };
}

export async function resetChecklistHistory(motherId: string) {
  clearChecklistDaySessions(motherId);
}
