/** In-memory daily checklist records when DynamoDB is unavailable (local dev). */
const store = new Map<string, Record<string, unknown>>();

function key(motherId: string, date: string) {
  return `${motherId}#${date}`;
}

export function saveChecklistDaySession(motherId: string, record: Record<string, unknown>) {
  const date = String(record.date ?? "");
  if (!date) return;
  store.set(key(motherId, date), { ...record, motherId, date });
}

export function getChecklistDaySession(motherId: string, date: string) {
  return store.get(key(motherId, date)) ?? null;
}

export function listChecklistDaySessions(motherId: string) {
  const prefix = `${motherId}#`;
  return [...store.entries()]
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

export function clearChecklistDaySessions(motherId: string) {
  const prefix = `${motherId}#`;
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
