/** In-memory care brief store when DynamoDB is unavailable (local dev). */
const store = new Map<string, Record<string, unknown>>();

export function saveCareBriefSession(motherId: string, record: Record<string, unknown>) {
  store.set(motherId, { ...record, motherId });
}

export function getCareBriefSession(motherId: string) {
  return store.get(motherId) ?? null;
}

export function listCareBriefSessions() {
  return [...store.values()];
}
