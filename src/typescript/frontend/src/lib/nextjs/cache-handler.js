const { PatchedFetchCache, PatchedFileSystemCache } = require("./cache-handlers");

/**
 * In case all other attempts to instantiate a cache handler fail, just pass no-ops.
 */
const NoOpCacheHandler = {
  get: async () => undefined,
  set: async () => {},
  resetRequestCache: () => {},
  revalidateTags: async () => {},
};

/**
 * This is a constructor-based factory that intercepts the constructor at runtime to return
 * either a FileSystemCache or a FetchCache. It's necessary because `nextjs` expects this module
 * specifically only return a default export in shape of a CacheHandler constructor; that is, it
 * calls it through `new CustomCacheHandler(...opts)`, *and* it only provides request headers at the
 * constructor call-site, so they aren't available until it's called.
 *
 * Essentially, this just intercepts the constructor and returns one of the underlying instances
 * based on which one is available, using the same logic `nextjs` does internally in the incremental
 * cache constructor.
 */
class CustomCacheHandler {
  /**
   * @typedef {ConstructorParameters<typeof PatchedFetchCache | typeof PatchedFileSystemCache>[0]} CacheHandlerArgs
   *
   * @typedef {{ canUseFileSystemCache?: boolean, shouldUseFetchCache?: boolean }} ExtraOpts
   *
   * @param {CacheHandlerArgs & ExtraOpts} ctx
   */
  constructor({ fs, serverDistDir, canUseFileSystemCache, shouldUseFetchCache, ...rest }) {
    if (canUseFileSystemCache === undefined || shouldUseFetchCache === undefined) {
      console.warn("WARNING: nextjs package wasn't properly patched to pass cache discriminators.");
      console.warn(
        "Keys included: ",
        Object.keys({ fs, serverDistDir, canUseFileSystemCache, shouldUseFetchCache, ...rest })
      );
    }

    if (shouldUseFetchCache) {
      return new PatchedFetchCache(rest);
    }
    if (canUseFileSystemCache && fs && serverDistDir) {
      return new PatchedFileSystemCache({
        fs,
        serverDistDir,
        ...rest,
      });
    }

    // Fall back to trying to figure it out ourselves. This means that the userland settings for
    // `const fetchCache = "..."` are ignored, since there's no way to get that context here.
    const minimalMode =
      process.env.NODE_ENV !== "development" || process.env.NEXT_PRIVATE_MINIMAL_MODE;
    if (minimalMode && PatchedFetchCache.isAvailable({ _requestHeaders: rest._requestHeaders })) {
      return new PatchedFetchCache(rest);
    }
    if (fs && serverDistDir) {
      return new PatchedFileSystemCache(rest);
    }
    console.warn("Not using a cache handler.");
    return NoOpCacheHandler;
  }
}

module.exports = CustomCacheHandler;
