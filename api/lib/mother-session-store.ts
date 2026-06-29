/** In-memory mother profile overrides (dev / demo when DynamoDB is unavailable). */
const overrides = new Map<string, Record<string, unknown>>();

export function saveMotherSession(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  if (!id) return;
  const prev = overrides.get(id) ?? {};
  overrides.set(id, { ...prev, ...record, id });
}

export function getMotherSession(motherId: string) {
  return overrides.get(motherId) ?? null;
}

export function getAllMotherSessions(): Map<string, Record<string, unknown>> {
  return new Map(overrides);
}
