const store = new Map<string, Record<string, unknown>>();

export function saveLabSession(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  if (!id) return;
  store.set(id, { ...record });
}

export function listLabSessions(patientId: string) {
  return [...store.values()].filter((r) => String(r.patientId) === patientId);
}
