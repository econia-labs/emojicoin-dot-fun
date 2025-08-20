import { unstableCacheKeyGenerator } from "lib/nextjs/generate-cache-key";
import { getCacheHandler, isPatchedFileSystemCache } from "lib/nextjs/get-incremental-cache";
import { createStabilizedProxy, unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchAptPrice } from "lib/queries/get-apt-price";
import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { fetchHomePagePriceFeed } from "lib/queries/price-feed";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";

import { fetchMarketStateJson } from "@/queries/market";
import { fetchAllMarkets, fetchArenaInfoJson } from "@/sdk/indexer-v2/queries";

export const fetchCachedMarketState = unstableCacheWrapper(
  fetchMarketStateJson,
  ["cached-market-state"],
  { revalidate: 10 }
);

const SHARED_BUILD_TIME_DATA_TAG = "shared-build-time-data" as const;

const innerFetchSharedBuildTimeData = async () => {
  const [marketsBySymbol, arenaInfo, aptPrice, numMarkets, priceFeed] = await Promise.all([
    fetchAllMarkets().then((r) =>
      Object.fromEntries(r.map((v) => [v.symbol_emojis.join(""), v] as const))
    ),
    fetchArenaInfoJson(),
    fetchAptPrice(),
    fetchNumRegisteredMarkets(),
    fetchHomePagePriceFeed(),
  ]);
  return { marketsBySymbol, arenaInfo, aptPrice, numMarkets, priceFeed };
};

/**
 * A cached fetch available only at build time to reduce the number of fetches from several
 * thousands to just a few.
 */
// Note that in development, `generateStaticParams` is run every time a page is visited, so
// the only way to know if this function should be used is by checking for NODE_ENV == "development"
export const fetchSharedBuildTimeData =
  IS_NEXT_BUILD_PHASE || process.env.NODE_ENV === "development"
    ? unstableCacheWrapper(innerFetchSharedBuildTimeData, [SHARED_BUILD_TIME_DATA_TAG], {
        revalidate: 60,
        tags: [SHARED_BUILD_TIME_DATA_TAG],
      })
    : undefined;

export const getSharedBuildTimeData = async () => {
  // Return undefined fast, since this path is used in production.
  if (!IS_NEXT_BUILD_PHASE && process.env.NODE_ENV !== "development") return undefined;

  const cacheHandler = getCacheHandler();
  // The fetch cache doesn't POST to the endpoint at build time for some reason, even if everything
  // is set up correctly. However, Vercel builds the previews with the filesystem cache, so it
  // should still work as expected here.
  if (!isPatchedFileSystemCache(cacheHandler) || !fetchSharedBuildTimeData) return undefined;

  const cacheKey = unstableCacheKeyGenerator(
    createStabilizedProxy(innerFetchSharedBuildTimeData, SHARED_BUILD_TIME_DATA_TAG),
    [SHARED_BUILD_TIME_DATA_TAG]
  )();
  const res = await cacheHandler.getFromStorage({ cacheKey, uuid: "" });
  if (res.body) {
    return JSON.parse(res.body) as ReturnType<typeof fetchSharedBuildTimeData>;
  }
  return undefined;
};
