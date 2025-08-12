const { PatchedFetchCache, PatchedFileSystemCache } = require("./cache-handlers");

/**
 */

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
  }
}

module.exports = CustomCacheHandler;
