/**
 * preloadImages
 *
 * Loads every image URL in parallel using Image() elements.
 * Calls onProgress(loaded, total) after each image settles (load OR error).
 * Returns a Promise that resolves once ALL images have settled.
 *
 * - Failed images are silently accepted so a single 404 can never block the splash.
 * - A per-image timeout of MAX_WAIT_MS prevents very slow CDN responses from
 *   stalling the splash indefinitely.
 */

const PER_IMAGE_TIMEOUT_MS = 8_000;

export interface PreloadProgress {
  loaded: number;
  total: number;
  /** 0–100 */
  percent: number;
}

export function preloadImages(
  urls: string[],
  onProgress?: (p: PreloadProgress) => void,
): Promise<void> {
  const total = urls.length;
  if (total === 0) return Promise.resolve();

  let loaded = 0;

  const tick = () => {
    loaded += 1;
    onProgress?.({
      loaded,
      total,
      percent: Math.round((loaded / total) * 100),
    });
  };

  const loadOne = (src: string): Promise<void> =>
    new Promise<void>(resolve => {
      const img = new Image();
      const timer = setTimeout(() => {
        // Treat timeout as "done" — don't block the whole splash
        tick();
        resolve();
      }, PER_IMAGE_TIMEOUT_MS);

      img.onload = () => {
        clearTimeout(timer);
        tick();
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        tick();
        resolve();
      };

      img.src = src;
    });

  return Promise.all(urls.map(loadOne)).then(() => undefined);
}
