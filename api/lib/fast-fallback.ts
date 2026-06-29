import { DEMO_USERS } from "../../src/lib/demo-users";

/** Demo motherId → auth user id (avoids slow USER table scans). */
const MOTHER_USER_IDS: Record<string, string> = {
  "MED-ELR-24018": "user-mother-elr",
  "MED-ELR-24031": "user-mother-sun",
};

export function resolveMotherUserId(motherId: string): string | null {
  if (MOTHER_USER_IDS[motherId]) return MOTHER_USER_IDS[motherId];
  const match = DEMO_USERS.find((u) => u.motherId === motherId);
  return match?.id ?? null;
}

/** Race a promise against a timeout; returns fallback when slow or rejected. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch((err) => {
        console.error("withTimeout promise rejected:", err);
        return fallback;
      }),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          console.warn(`withTimeout reached limit of ${ms}ms`);
          resolve(fallback);
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
