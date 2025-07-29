import { IS_NEXT_BUILD_PHASE } from "lib/server-env";

// Create a top-level global promise cache for build time fetches/queries to use.
const promiseCache = new Map<string, Promise<unknown>>();

/**
 * Lots of calls are redundant and duplicated when building the application statically.
 * To reduce the number of fetches made to external endpoints at build time, use a build cache
 * in the form of lazy promises.
 */
export function maybeCacheBuildFetch<T>(key: string, factory: () => Promise<T>): Promise<T> {
  // Call the function (don't memoize) if it's not in the build process.
  if (IS_NEXT_BUILD_PHASE) {
    return factory();
  }
  if (!promiseCache.has(key)) {
    const promise = factory();
    promiseCache.set(key, promise);
  }
  return promiseCache.get(key)! as Promise<T>;
}
