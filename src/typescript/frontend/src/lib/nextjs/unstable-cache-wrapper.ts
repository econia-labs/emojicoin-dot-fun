/* eslint-disable @typescript-eslint/no-explicit-any */

import { IS_NEXT_BUILD_PHASE } from "lib/server-env";
import { unstable_cache } from "next/cache";

import { generateCacheKeyForUnstableCache } from "./generate-cache-key";

type Callback = (...args: any[]) => Promise<any>;

const buildCache = IS_NEXT_BUILD_PHASE ? new Map<string, Promise<{}>>() : undefined;

// let i = 0;

/**
 * Since `unstable_cache` doesn't work at build time, and there are some fetches that are repeated
 * in several different components at build time, it's necessary to memoize the value of fetch
 * results manually at build time to avoid making repeated queries/fetches.
 *
 * This function chooses between `unstable_cache` and the memoized build fetch, depending on whether
 * or not the passed function is running at build time or at runtime.
 *
 * This function also facilitates skipping `unstable_cache` entirely, in the case where
 * a separate unstable cache entry is unnecessary for a fetch/query.
 */
export function cacheWrapper<T extends Callback>(
  cb: T,
  keyParts: string[],
  options: {
    /**
     * The revalidation interval in seconds.
     */
    revalidate?: number | false;
    tags?: string[];
    noUnstableCache?: boolean;
  }
): T {
  if (buildCache) {
    const cacheKeyFunction = generateCacheKeyForUnstableCache(cb, keyParts);
    const memoizedBuildFetch = async (...args: any[]) => {
      // Due to minification, the `cb.toString()` in the cache key generation will result in some
      // misses that should be hits, but it still works for the most part.
      const cacheKey = cacheKeyFunction(args);
      // console.log(cacheKey);
      if (!buildCache.has(cacheKey)) {
        // console.log(
        //   `i: ${i++}, Cache MISS for ${options?.tags?.join("") + ", " + cb.name}, keyParts: ${keyParts}, args: ${JSON.stringify(args)}`
        // );
        const promise = cb(...args);
        buildCache.set(cacheKey, promise);
      } else {
        if (options?.noUnstableCache) {
          // console.log(
          //   `Cache HIT for ${options?.tags?.join("") + ", " + cb.name}, keyParts: ${keyParts}, args: ${JSON.stringify(args)}`
          // );
        }
      }
      const res = await buildCache.get(cacheKey);
      return res as ReturnType<T>;
    };
    return memoizedBuildFetch as unknown as T;
  } else {
    if (options?.noUnstableCache) {
      return cb;
    }
    return unstable_cache(cb, keyParts, options);
  }
}
