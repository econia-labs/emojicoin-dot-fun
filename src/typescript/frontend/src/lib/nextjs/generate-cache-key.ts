/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "crypto";

import { getIncrementalCache } from "./get-incremental-cache";

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
 *
 * @returns The function that generates an `unstable_cache` key given the arg inputs.
 */
export function unstableCacheKeyGenerator<T extends Callback>(cb: T, keyParts?: string[]) {
  const fixedKey = `${cb.toString()}-${Array.isArray(keyParts) && keyParts.join(",")}`;

  const cachedCb = (...args: any[]) => {
    const invocationKey = `${fixedKey}-${JSON.stringify(args)}`;
    const cacheKey = generateCacheKey(invocationKey);
    return cacheKey;
  };

  return cachedCb;
}

/**
 * Nextjs' cache key generation function. Copied and simplified from source for v14.2.25.
 */
function generateCacheKey(invocationKey: string): string {
  const MAIN_KEY_PREFIX = "v3";

  const cacheString = JSON.stringify([
    MAIN_KEY_PREFIX,
    getIncrementalCache()?.fetchCacheKeyPrefix || "",
    // The normal usage for `fetch` cache keys are marked below. For `unstable_cache` wrapped
    // functions, only the `invocationKey` is present, which is passed down as the url.
    invocationKey, // url
    undefined, // init.method
    {}, // headers
    undefined, // init.mode
    undefined, // init.redirect
    undefined, // init.credentials
    undefined, // init.referrer
    undefined, // init.referrerPolicy
    undefined, // init.integrity
    undefined, // init.cache
    [], // bodyChunks
  ]);

  return createHash("sha256").update(cacheString).digest("hex");
}
