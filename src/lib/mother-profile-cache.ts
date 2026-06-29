const STORAGE_KEY = "meds-inn-mother-overrides";

export function readMotherOverride(motherId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    return map[motherId] ?? null;
  } catch {
    return null;
  }
}

export function writeMotherOverride(motherId: string, record: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, unknown>>) : {};
    map[motherId] = { ...map[motherId], ...record, id: motherId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

export function mergeMotherProfile<T extends Record<string, unknown>>(motherId: string, base: T): T {
  const override = readMotherOverride(motherId);
  if (!override) return base;
  return { ...base, ...override } as T;
}
