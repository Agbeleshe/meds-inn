const store = new Map<string, Record<string, unknown>>();

export function saveVideoSessionSession(appointmentId: string, record: Record<string, unknown>) {
  store.set(appointmentId, { ...record });
}

export function getVideoSessionSession(appointmentId: string) {
  return store.get(appointmentId) ?? null;
}
