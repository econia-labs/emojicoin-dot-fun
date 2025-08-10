// @ts-check
// cspell:word undici

const FetchCache = require("next/dist/server/lib/incremental-cache/fetch-cache").default;
const crypto = require("crypto");
const nextConfig = require("../../../next.config.mjs");
const { cloneResponse } = require("next/dist/server/lib/clone-response");

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const _CACHE_TAGS_HEADER = "x-vercel-cache-tags";
const _CACHE_HEADERS_HEADER = "x-vercel-sc-headers";
const CACHE_STATE_HEADER = "x-vercel-cache-state";
const _CACHE_REVALIDATE_HEADER = "x-vercel-revalidate";
const _CACHE_FETCH_URL_HEADER = "x-vercel-cache-item-name";
const CACHE_CONTROL_VALUE_HEADER = "x-vercel-cache-control";
const VERCEL_CACHE_CONTROL_HEADER = "vercel-cdn-cache-control";

const UUID_PREFIX = "__uuid-";

const swrDelta = nextConfig?.default.experimental?.swrDelta || 60;

// In case the global cache log hasn't been set by the time this file is imported.
if (!globalThis.__cacheLog) globalThis.__cacheLog = () => {};

class PatchedFetchCache extends FetchCache {
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
   * @returns {string}
   */
  static generateUUID() {
    return `${UUID_PREFIX}${crypto.randomUUID()}`;
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
   * @param {string} uuid
   */
  removeEntry(uuid) {
    this.shouldNotPost.delete(uuid);
    this.numFetches.delete(uuid);
  }

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
  async pollCacheEndpoint({
    cacheKey,
    uuid,
    // CDN GETs are cheap, and this function likely won't run all that often.
    pollingInterval = 100,
    numAttempts = 20,
    waitOnFresh = true,
  }) {
    for (let i = 0; i < numAttempts; i += 1) {
      const prev = this.numFetches.get(uuid) ?? 0;
      this.numFetches.set(uuid, prev + 1);
      await sleep(pollingInterval);
      const res = await this.getFromCDN(cacheKey);

      if (!res) {
        console.warn("No CDN response in patched fetch cache.");
        globalThis.__cacheLog({ cacheKey: "NO CDN RESPONSE", entry: "", uuid });
        return null;
      }

      const state = res.headers.get(CACHE_STATE_HEADER);
      const age = parseInt(res.headers.get("age") || "0", 10);
      const date = res.headers.get("date");

      if (res.ok) {
        /** @type Promise<unknown> */
        const parsedBodyPromise = res
          .json() // `r` is whatever the CDN returns; we expect { data: { body: string } }
          .then(
            /** @param {{ data?: { body?: string } } } r */
            (r) => JSON.parse(r?.data?.body ?? "null")
          );
        if (state === "fresh" || !waitOnFresh) {
          return parsedBodyPromise;
        }

        // Just return it if it's not too old- to avoid an origin fetch.
        if (i === numAttempts - 1 && state === "stale-while-revalidate" && age < swrDelta) {
          console.warn(`Returned stale data for cache key ${cacheKey}, age: ${age}`);
          globalThis.__cacheLog({ cacheKey, entry: `Returned stale data, age: ${age}` });
          return parsedBodyPromise;
        }
      }
    }

    return null;
  }

  /**
   * Intercept "FETCH" entries to control posting behavior keyed by a UUID tag.
   * For non-FETCH kinds, defer to the base implementation.
   *
   * @type {import("next/dist/server/lib/incremental-cache/fetch-cache").default["set"]}
   */
  async set(...args) {
    const [cacheKey, data, ctx] = args;
    const { fetchCache, fetchUrl } = ctx;

    if (!fetchCache) return;
    if (data?.kind !== "FETCH") return super.set(cacheKey, data, ctx);

    // Find `idx` and remove `uuid` from that index if it exists.
    const idx = ctx.tags?.findIndex((v) => v.startsWith(UUID_PREFIX)) ?? -1;
    const uuid = (idx > -1 ? ctx.tags?.splice(idx, 1).pop() : "") ?? "";

    /**
     * @param {string} msg
     * @returns {void}
     */
    const addToCacheKeyLog = (msg) =>
      globalThis.__cacheLog({
        cacheKey,
        entry: `${msg} ${fetchUrl}`,
        uuid,
      });

    if (this.shouldNotPost.has(uuid)) {
      addToCacheKeyLog(`SKIP after ${this.numFetches.get(uuid)} fetches`);
      this.removeEntry(uuid);
      return;
    }

    addToCacheKeyLog("POST");
    this.removeEntry(uuid);
    return super.set(cacheKey, data, ctx);
  }
}

module.exports = PatchedFetchCache;
