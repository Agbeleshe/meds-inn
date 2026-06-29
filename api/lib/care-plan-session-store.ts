/** In-memory care plan store when DynamoDB is unavailable (local dev). */
const store = new Map<string, Record<string, unknown>>();

export function saveCarePlanSession(motherId: string, record: Record<string, unknown>) {
  store.set(motherId, { ...record, motherId });
}

export function getCarePlanSession(motherId: string) {
  return store.get(motherId) ?? null;
}
