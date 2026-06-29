/** In-memory notifications when DynamoDB is unavailable (local dev). */
const store = new Map<string, Record<string, unknown>[]>();

export function appendNotificationSession(userId: string, record: Record<string, unknown>) {
  const list = store.get(userId) ?? [];
  store.set(userId, [record, ...list].slice(0, 50));
}

export function listNotificationSessions(userId: string) {
  return store.get(userId) ?? [];
}

export function markNotificationSessionRead(userId: string, notificationId: string) {
  const list = store.get(userId);
  if (!list) return null;
  let updated: Record<string, unknown> | null = null;
  const next = list.map((n) => {
    if (String(n.id) !== notificationId) return n;
    updated = { ...n, read: true };
    return updated;
  });
  store.set(userId, next);
  return updated;
}
