/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "crypto";

type Callback = (...args: any[]) => Promise<any>;

/**
 * A utility function for getting the cache key of an `unstable_cache` function.
 *
 * This function generates the file name of the cache entry in the `.next/cache/fetch-cache` folder
 * in local development. It can be used to debug and verify that `unstable_cache` fetches are being
 * cached properly.
 *
 * @param cb The same `cb` passed to `unstable_cache`.
 * @param keyParts The same `keyParts` passed to `unstable_cache`.
 */
export function generateCacheKeyForUnstableCache<T extends Callback>(
  cb: T,
  keyParts?: string[]
): T {
  const fixedKey = `${cb.toString()}-${Array.isArray(keyParts) && keyParts.join(",")}`;

  const cachedCb = (...args: any[]) => {
    const invocationKey = `${fixedKey}-${JSON.stringify(args)}`;
    const cacheKey = generateCacheKey(invocationKey);
    return cacheKey;
  };

  return cachedCb as unknown as T;
}

/**
 * Nextjs' cache key generation function. Copied and simplified from source for v14.2.25.
 */
function generateCacheKey(invocationKey: string): string {
  const MAIN_KEY_PREFIX = "v3";

  const cacheString = JSON.stringify([
    MAIN_KEY_PREFIX,
    "",
    invocationKey,
    {},
    {},
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    [],
  ]);

  return createHash("sha256").update(cacheString).digest("hex");
}
