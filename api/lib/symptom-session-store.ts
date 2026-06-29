const store = new Map<string, Record<string, unknown>>();

export function saveSymptomSession(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  if (!id) return;
  store.set(id, { ...record });
}

export function listSymptomSessions(patientId: string) {
  return [...store.values()].filter((r) => String(r.patientId) === patientId);
}

export function getSymptomSession(id: string) {
  return store.get(id) ?? null;
}
