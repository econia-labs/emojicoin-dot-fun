// @ts-check
// cspell:word undici

const FetchCache = require("next/dist/server/lib/incremental-cache/fetch-cache").default;
const FileSystemCache = require("next/dist/server/lib/incremental-cache/file-system-cache").default;
const { CacheHandler } = require("next/dist/server/lib/incremental-cache");
const crypto = require("crypto");
const nextConfig = require("../../../next.config.mjs");
const { cloneResponse } = require("next/dist/server/lib/clone-response");

/**
 * @type {typeof import("../../../../sdk/src/utils/log-cache-debug").logCacheDebug} next/dist/server/lib/incremental-cache
 */
const logCacheDebug = (args) => globalThis.__logCacheDebug(args);

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CACHE_STATE_HEADER = "x-vercel-cache-state";
const CACHE_CONTROL_VALUE_HEADER = "x-vercel-cache-control";
const VERCEL_CACHE_CONTROL_HEADER = "vercel-cdn-cache-control";

const UUID_PREFIX = "__uuid-";

const swrDelta = nextConfig?.default.experimental?.swrDelta || 60;

/**
 * @param {string[] | undefined} tags
 * @returns {string | undefined}
 *
 */
function findUUID(tags) {
  return tags?.find((v) => v.startsWith(UUID_PREFIX));
}

/**
 * @returns {string}
 */
function _generateUUID() {
  return `${UUID_PREFIX}${crypto.randomUUID()}`;
}

/**
 * @param {{
 *   label: Parameters<typeof logCacheDebug>[0]["label"],
 *   msg?: string,
 *   args: Parameters<FetchCache["get"]> | Parameters<FetchCache["set"]>,
 * }} params
 */
async function addToCacheKeyLog({ label, msg, args }) {
  // `set` has 3 args, `get` has 2. Can't use -1 for `ctx` because sometimes it's not present.
  const [cacheKey, ctx] = args.length === 3 ? [args[0], args[2]] : [args[0], args[1]];
  logCacheDebug({
    cacheKey,
    label,
    msg,
    fetchUrl: ctx?.fetchUrl,
    uuid: findUUID(ctx?.tags),
  });
}
class FetchDeduplicater {
  /** @type {Map<string, Parameters<CacheHandler["get"]>[1]>} */
  contextMap = new Map();

  /** @type {Set<string>} */
  shouldNotPost = new Set([]);

  /** @type {Map<string, number>} */
  numFetches = new Map();

  /**
   * @param {string} uuid
   */
  markAsDoNotPost(uuid) {
    this.shouldNotPost.add(uuid);
  }

  /**
   * @param {string[] | undefined} tags NOTE: `tags` is mutated in this function.
   * @param {string | undefined} uuid
   */
  removeEntry(tags, uuid) {
    if (!uuid) return;
    if (tags) {
      const idx = tags.findIndex((v) => v === uuid) ?? -1;
      if (idx > -1) {
        // Mutate the `tags` array by removing the uuid.
        tags.splice(idx, 1);
      }
    }
    this.shouldNotPost.delete(uuid);
    this.numFetches.delete(uuid);
    this.contextMap.delete(uuid);
  }

  /**
   * Intercept "FETCH" entries to control posting behavior keyed by a UUID tag.
   * For non-FETCH kinds, defer to the base implementation.
   *
   * @param {{
   *   args: Parameters<(FetchCache | FileSystemCache)["get"]>,
   *   superGet: (FetchCache | FileSystemCache)["get"],
   * }} params
   */
  async get({ args, superGet }) {
    const [cacheKey, ctx] = args;
    const uuid = findUUID(ctx?.tags);
    if (uuid && !this.contextMap.has(uuid)) {
      this.contextMap.set(uuid, ctx);
    }
    addToCacheKeyLog({ label: ["GET", "fetchGet"], args });
    return superGet(...args);
  }

  /**
   * Intercept "FETCH" entries to control posting behavior keyed by a UUID tag.
   * For non-FETCH kinds, defer to the base implementation.
   *
   * @param {{
   *   args: Parameters<(FetchCache | FileSystemCache)["set"]>,
   *   superSet: (FetchCache | FileSystemCache)["set"],
   * }} params
   */
  async set({ args, superSet }) {
    const [cacheKey, data, ctx] = args;
    const { fetchCache, fetchUrl } = ctx;

    if (!fetchCache) return;
    if (data?.kind !== "FETCH") return superSet(cacheKey, data, ctx);

    const uuid = findUUID(ctx.tags);

    if (uuid && this.shouldNotPost.has(uuid)) {
      addToCacheKeyLog({
        label: ["POLL HIT", "debug"],
        msg: `Poll hit after ${this.numFetches.get(uuid)} fetches`,
        args,
      });
      this.removeEntry(ctx.tags, uuid);
      return;
    }

    addToCacheKeyLog({ label: ["POST", "info"], args });
    this.removeEntry(ctx.tags, uuid);
    return superSet(cacheKey, data, ctx);
  }

  /**
   * Poll storage until fresh (or acceptable stale) data is available.
   *
   * NOTE: `getEntryFromStorage` is the underlying implementation-specific mechanism for retrieval.
   *
   * @template T
   * @param {{
   *   cacheKey: string,
   *   uuid: string,
   *   pollingInterval: number,
   *   numAttempts: number,
   *   getEntryFromStorage: (cacheKey: string, uuid?: string) => Promise<{ isStale: boolean, parsedBody: T }>,
   *   waitOnFresh?: boolean
   * }} params
   * @returns {Promise<T | null>} Parsed JSON body or null if not obtained.
   */
  async pollCacheEntry({ cacheKey, uuid, pollingInterval, numAttempts, getEntryFromStorage }) {
    for (let i = 0; i < numAttempts; i += 1) {
      const prev = this.numFetches.get(uuid) ?? 0;
      this.numFetches.set(uuid, prev + 1);
      await sleep(pollingInterval);
      const res = await getEntryFromStorage(cacheKey);
      if (!res) {
        logCacheDebug({
          cacheKey,
          label: ["FAILURE", "error"],
          msg: "Couldn't retrieve cache entry.",
          alwaysLog: true,
        });
        return null;
      }

      if (!res.isStale && res.parsedBody) {
        return res.parsedBody;
      }
    }

    return null;
  }
}

class PatchedFileSystemCache extends FileSystemCache {
  /**
   * @param {ConstructorParameters<typeof FileSystemCache>} args
   */
  constructor(...args) {
    super(...args);
    this.deduplicator = new FetchDeduplicater();
  }

  static generateUUID() {
    return _generateUUID();
  }

  /**
   * Poll the filesystem cache until fresh (or acceptable stale) data is available.
   *
   * @param {{
   *   cacheKey: string,
   *   uuid: string,
   *   pollingInterval?: number,
   *   numAttempts?: number,
   *   waitOnFresh?: boolean
   * }} params
   * @returns {Promise<unknown|null>} Parsed JSON body or null if not obtained.
   */
  async pollCacheEntry({
    cacheKey,
    uuid,
    pollingInterval = 10,
    numAttempts = 200,
    waitOnFresh = true,
  }) {
    if (!this["flushToDisk"]) return null;
    try {
      const filePath = this["getFilePath"](`${cacheKey}`, "fetch");
      const fileData = await this["fs"].readFile(filePath, "utf8");
      const { mtime } = await this["fs"].stat(filePath);

      const lastModified = mtime.getTime();
      const cacheData = {
        lastModified: mtime.getTime(),
        /** @type {import("next/dist/server/response-cache").CachedFetchValue} */
        value: JSON.parse(fileData),
      };
      const ctx = this.deduplicator.contextMap.get(uuid) ?? {};
      const revalidate = ctx.revalidate || cacheData.value.revalidate;
      const age = (Date.now() - (cacheData.lastModified || 0)) / 1000;

      const isStale = age > revalidate;
      const data = cacheData.value.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   * @type {FileSystemCache["get"]}
   */
  async get(...args) {
    return this.deduplicator.get({
      args,
      superGet: super.get.bind(this),
    });
  }

  /**
   * @type {FileSystemCache["set"]}
   */
  async set(...args) {
    return this.deduplicator.set({
      args,
      superSet: super.set.bind(this),
    });
  }
}

class PatchedFetchCache extends FetchCache {
  /**
   * @param {ConstructorParameters<typeof FetchCache>} args
   */
  constructor(...args) {
    super(...args);
    this.deduplicator = new FetchDeduplicater();
  }

  static generateUUID() {
    return _generateUUID();
  }

  /**
   * The base class stores these privately; we just surface them with minimal typing.
   * @returns {{ cacheEndpoint?: string, headers?: Record<string, string> }}
   */
  getCacheEndpointAndHeaders() {
    return {
      cacheEndpoint: this["cacheEndpoint"],
      headers: this["headers"],
    };
  }

  /**
   * Bypass all nextjs patched fetching behavior and fetch a cache entry directly from Vercel's CDN.
   * Note that the `internal` flag must be passed to bypass the fetch patch applied at build time.
   *
   * @param {string} cacheKey
   * @returns {ReturnType<Parameters<FetchDeduplicater["pollCacheEntry"]>[0]["getEntryFromStorage"]>}
   * @throws if the value can't be retrieved somehow
   */
  async getFromStorage(cacheKey) {
    const { cacheEndpoint, headers } = this.getCacheEndpointAndHeaders();
    if (!cacheEndpoint || !headers) {
      throw new Error("Couldn't get cache endpoint or headers.");
    }

    // The Vercel CDN docs suggest doing this to force a fresh return value, but not sure if they
    // meant it in some other context than directly hitting the CDN. Regardless, it's harmless.
    const extraHeaders = {
      [CACHE_CONTROL_VALUE_HEADER]: "cache-control: public, max-age=0, must-revalidate",
      [VERCEL_CACHE_CONTROL_HEADER]: "cache-control: public, max-age=0, must-revalidate",
      pragma: "no-cache",
    };

    const response = fetch(`${cacheEndpoint}/v1/suspense-cache/${cacheKey}`, {
      method: "GET",
      headers: {
        ...headers,
        ...extraHeaders,
      },
      /** This is necessary to bypass *all* fetch deduping. Unless this is here, this will always
       * return the first value retrieved from the CDN.
       * @see {@link https://github.com/vercel/next.js/blob/e65628a237ea76d77d911aedb12d5137fddd90fb/packages/next/src/server/lib/dedupe-fetch.ts#L45}
       */
      signal: new AbortController().signal,
      /**
       * Override the type. This is how they do it in next's `fetch-cache.ts`.
       * @type {NextFetchRequestConfig}
       */
      next: {
        // @ts-expect-error The `internal` field isn't exposed publicly, but this is correct.
        // See `fetch-cache.ts` in the next codebase.
        internal: true,
        fetchType: "cache-get",
        fetchUrl: "",
        fetchIdx: 0,
      },
    })
      // Fix the undici cloning bug. See the documentation on `cloneResponse` for more details.
      // This is necessary because we've subverted the next.js deduping efforts by passing the abort
      // controller signal, which is the code path where the undici fix is.
      .then(cloneResponse)
      .then(([cloned1, _cloned2]) => cloned1);

    const res = await response;

    const state = res.headers.get(CACHE_STATE_HEADER);
    if (!res) {
      throw new Error("No CDN response in patched fetch cache.");
    }

    if (!res.ok) {
      console.error(await res.text());
      throw new Error(`Invalid response from cache: ${res.status}`);
    }

    const parsedBody = await res
      .json() // `r` is whatever the CDN returns; we expect { data: { body: string } }
      .then(
        /** @param {{ data?: { body?: string } } } r */
        (r) => JSON.parse(r?.data?.body ?? "null")
      );
    return {
      isStale: state === "fresh",
      parsedBody,
    };
  }

  // WIP refresher
  // -------------------------------------
  //
  // TODO: 11:12 PM 8-10-2025
  // TODO: Refactor `pollCacheEndpoint` to call the underlying `FetchDeduplicator` impl of it
  //
  // by passnig in the `getFromStorage` in this body
  // Then do the same for FileSystemCache
  // Then do the dynamic/contingent decision to use file system cache or fetch cache in next.config.mjs
  // The refactor is almost done
  

  /**
   * Bypass all nextjs patched fetching behavior and fetch a cache entry directly from Vercel's CDN.
   * Note that the `internal` flag must be passed to bypass the fetch patch applied at build time.
   *
   * @param {string} cacheKey
   * @returns {Promise<Response|null>}
   */
  async getFromCDN(cacheKey) {
    const { cacheEndpoint, headers } = this.getCacheEndpointAndHeaders();
    if (!cacheEndpoint || !headers) return null;

    // Not sure if this actually does anything- the Vercel CDN docs are a bit unclear if they're
    // intended for these to be used only in Vercel functions or if they'll work here. Regardless,
    // it doesn't hurt to add them here.
    const extraHeaders = {
      [CACHE_CONTROL_VALUE_HEADER]: "cache-control: public, max-age=0, must-revalidate",
      [VERCEL_CACHE_CONTROL_HEADER]: "cache-control: public, max-age=0, must-revalidate",
      pragma: "no-cache",
    };

    const res = fetch(`${cacheEndpoint}/v1/suspense-cache/${cacheKey}`, {
      method: "GET",
      headers: {
        ...headers,
        ...extraHeaders,
      },
      /** This is necessary to bypass *all* fetch deduping. Unless this is here, this will always
       * return the first value retrieved from the CDN.
       * @see {@link https://github.com/vercel/next.js/blob/e65628a237ea76d77d911aedb12d5137fddd90fb/packages/next/src/server/lib/dedupe-fetch.ts#L45}
       */
      signal: new AbortController().signal,
      /**
       * Override the type. This is how they do it in next's `fetch-cache.ts`.
       * @type {NextFetchRequestConfig}
       */
      next: {
        // @ts-expect-error The `internal` field isn't exposed publicly, but this is correct.
        // See `fetch-cache.ts` in the next codebase.
        internal: true,
        fetchType: "cache-get",
        fetchUrl: "",
        fetchIdx: 0,
      },
    })
      // Fix the undici cloning bug. See the documentation on `cloneResponse` for more details.
      // This is necessary because we've subverted the next.js deduping efforts by passing the abort
      // controller signal, which is the code path where the undici fix is.
      .then(cloneResponse)
      .then(([cloned1, _cloned2]) => cloned1);

    return res;
  }

  /**
   * Poll Vercel CDN until fresh (or acceptable stale) data is available.
   *
   * @param {{
   *   cacheKey: string,
   *   uuid: string,
   *   pollingInterval?: number,
   *   numAttempts?: number,
   *   waitOnFresh?: boolean
   * }} params
   * @returns {Promise<unknown|null>} Parsed JSON body or null if not obtained.
   */
  async pollCacheEntry({
    cacheKey,
    uuid,
    // CDN GETs are cheap, and this function likely won't run all that often.
    pollingInterval = 100,
    numAttempts = 20,
    waitOnFresh = true,
  }) {
    for (let i = 0; i < numAttempts; i += 1) {
      const prev = this.deduplicator.numFetches.get(uuid) ?? 0;
      this.deduplicator.numFetches.set(uuid, prev + 1);
      await sleep(pollingInterval);
      const res = await this.getFromCDN(cacheKey);

      if (!res) {
        console.warn("No CDN response in patched fetch cache.");
        logCacheDebug({
          cacheKey,
          label: ["FAILURE", "error"],
          msg: "Couldn't get CDN response.",
          alwaysLog: true,
        });
        return null;
      }

      const state = res.headers.get(CACHE_STATE_HEADER);
      const age = parseInt(res.headers.get("age") || "0", 10);

      if (res.ok) {
        /** @type Promise<unknown> */
        const parsedBody = await res
          .json() // `r` is whatever the CDN returns; we expect { data: { body: string } }
          .then(
            /** @param {{ data?: { body?: string } } } r */
            (r) => JSON.parse(r?.data?.body ?? "null")
          );
        if (state === "fresh" || !waitOnFresh) {
          return parsedBody;
        }

        // Just return it if it's not too old- to avoid an origin fetch.
        if (i === numAttempts - 1 && state === "stale-while-revalidate" && age < swrDelta) {
          console.warn(`Returned stale data for cache key ${cacheKey}, age: ${age}`);
          logCacheDebug({
            cacheKey,
            label: ["STALE RETURN", "warning"],
            msg: `Returned stale data, age: ${age}`,
          });
          return parsedBody;
        }
      }
    }

    return null;
  }

  /**
   * @type {FetchCache["get"]}
   */
  async get(...args) {
    return this.deduplicator.get({
      args,
      superGet: super.get.bind(this),
    });
  }

  /**
   * @type {FetchCache["set"]}
   */
  async set(...args) {
    return this.deduplicator.set({
      args,
      superSet: super.set.bind(this),
    });
  }
}

module.exports = PatchedFetchCache;
