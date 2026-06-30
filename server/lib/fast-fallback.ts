/**
 * Previously returned a hardcoded demo motherId → userId mapping.
 * Demo data has been removed; this always returns null so callers
 * fall through to the DynamoDB lookup.
 */
export function resolveMotherUserId(_motherId: string): string | null {
  return null;
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
