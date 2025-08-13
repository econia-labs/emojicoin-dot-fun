const {
  default: FileSystemCache,
} = require("next/dist/server/lib/incremental-cache/file-system-cache");
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

    const debug = (s) => {
      if (process.env.CACHE_HANDLER_DEBUG) {
        console.log(s);
      }
    };

    if (shouldUseFetchCache) {
      debug("Using patched fetch cache.");
      return new PatchedFetchCache(rest);
    }
    if (canUseFileSystemCache && fs && serverDistDir) {
      debug("Using patched file system cache.");
      return new PatchedFileSystemCache({
        fs,
        serverDistDir,
        ...rest,
      });
    }

    // Decide which to use in case the next patch hasn't been applied for some reason.
    // This means that the userland settings for `const fetchCache = "..."` are ignored, since
    // there's no way to get that context here.
    if (PatchedFetchCache.isAvailable({ _requestHeaders: rest._requestHeaders })) {
      debug("Using patched fetch cache from fallback logic.");
      return new PatchedFetchCache(rest);
    }
    if (fs && serverDistDir) {
      debug("Using patched file system cache from fallback logic.");
      return new PatchedFileSystemCache(rest);
    }

    // Default to a basic file system cache that only writes to disk if `fs` and `serverDistDir`.
    const flushToDisk = rest.flushToDisk || (fs && serverDistDir);
    console.warn(`Using the basic file system cache with flushToDisk: ${flushToDisk}`);
    return new FileSystemCache({ ...rest, flushToDisk });
    return NoOpCacheHandler;
  }
}

module.exports = CustomCacheHandler;
