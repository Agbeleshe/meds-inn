/** In-memory appointment store when DynamoDB is unavailable (local dev). */
const store = new Map<string, Record<string, unknown>>();

export function saveAppointmentSession(record: Record<string, unknown>) {
  const id = String(record.id ?? "");
  if (!id) return;
  store.set(id, { ...record, id });
}

export function getAppointmentSession(id: string) {
  return store.get(id) ?? null;
}

export function listAppointmentSessions(hospitalId?: string) {
  return [...store.values()].filter(
    (a) => !hospitalId || String(a.hospitalId ?? "ELR") === hospitalId,
  );
}
