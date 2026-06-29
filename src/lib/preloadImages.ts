/**
 * preloadImages
 *
 * Loads image URLs in parallel. Tracks successfully loaded URLs in
 * sessionStorage so repeat visits / refreshes skip the network for
 * images that were already fetched in this browser session.
 */

const PER_IMAGE_TIMEOUT_MS = 8_000;
const CACHE_KEY = 'meds-inn-image-cache-v1';

export interface PreloadProgress {
  loaded: number;
  total: number;
  /** 0–100 */
  percent: number;
}

function readCache(): Set<string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeCache(urls: Set<string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...urls]));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

function markCached(url: string) {
  const cache = readCache();
  cache.add(url);
  writeCache(cache);
}

export function isImageCached(url: string): boolean {
  return readCache().has(url);
}

export function preloadImages(
  urls: string[],
  onProgress?: (p: PreloadProgress) => void,
): Promise<void> {
  const total = urls.length;
  if (total === 0) {
    onProgress?.({ loaded: 0, total: 0, percent: 100 });
    return Promise.resolve();
  }

  const cache = readCache();
  const cachedUrls = urls.filter((u) => cache.has(u));
  const uncachedUrls = urls.filter((u) => !cache.has(u));

  let loaded = cachedUrls.length;

  const report = () => {
    onProgress?.({
      loaded,
      total,
      percent: Math.round((loaded / total) * 100),
    });
  };

  report();

  if (uncachedUrls.length === 0) {
    return Promise.resolve();
  }

  const loadOne = (src: string): Promise<void> =>
    new Promise<void>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => {
        loaded += 1;
        report();
        resolve();
      }, PER_IMAGE_TIMEOUT_MS);

      img.onload = () => {
        clearTimeout(timer);
        markCached(src);
        loaded += 1;
        report();
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        loaded += 1;
        report();
        resolve();
      };

      img.src = src;
    });

  return Promise.all(uncachedUrls.map(loadOne)).then(() => undefined);
}
