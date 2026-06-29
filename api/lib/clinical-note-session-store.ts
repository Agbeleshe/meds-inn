const store = new Map<string, Record<string, unknown>>();

export function saveClinicalNoteSession(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  if (!id) return;
  store.set(id, { ...record });
}

export function listClinicalNoteSessions(patientId: string) {
  return [...store.values()].filter((r) => String(r.patientId) === patientId);
}
