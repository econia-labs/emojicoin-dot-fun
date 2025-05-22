import "server-only";

import Big from "big.js";
import { unstable_cache } from "next/cache";

import type { PartialPriceFeedJson } from "@/sdk/index";
import { DEBUG_ASSERT } from "@/sdk/index";
import {
  fetchMarketsJson,
  fetchPriceFeedWithMarketState,
  fetchSpecificMarketsPriceFeedUnsafe,
} from "@/sdk/indexer-v2";

import type { StatsSchemaOutput } from "./schema";
import { STATS_MARKETS_PER_PAGE } from "./schema";

/**
 * Fetches the cached, paginated market state stats query.
 *
 * Normalizes all queries into the final output of the price feed query.
 *
 * NOTE: This does not perform input validation on the page number. Always validate the `page` input
 * param before calling this function.
 */
const fetchCachedPaginatedMarketStats = unstable_cache(
  async (args: StatsSchemaOutput): Promise<PartialPriceFeedJson[]> => {
    const { sortBy } = args;
    const pageSize = STATS_MARKETS_PER_PAGE;

    // If sorting by the price delta percentage, simply query the `price_feed` table.
    if (sortBy === "delta") {
      return fetchPriceFeedWithMarketState({ ...args, pageSize });
    }

    // Normalize the regular market state data into price feed data by fetching the delta percentage
    // for the results of the market_state. This could be combined into one query, but the
    // performance impact is negligible since it's searching directly by specific markets.
    return fetchMarketsJson({ ...args, sortBy, pageSize }).then(async (markets) => {
      // Preserve the original ordering when sorting by `sortBy`.
      const originalOrdering = markets.map((mkt) => mkt.market_id);

      // Map the markets without daily volume to an object of market ID => market data.
      const marketsWithoutDailyVolume = Object.fromEntries(
        markets
          .filter((mkt) => Big(mkt.daily_volume).eq(0))
          .map((mkt) => ({
            ...mkt,
            open_price_q64: null,
            close_price_q64: null,
            delta_percentage: null,
          }))
          .map((mkt) => [mkt.market_id, mkt])
      );

      // Get the price feed data for markets with daily volume.
      const priceFeedDataForMarketsWithDailyVolume = await fetchSpecificMarketsPriceFeedUnsafe(
        markets.filter((mkt) => Big(mkt.daily_volume).gt(0)).map((mkt) => mkt.symbol_emojis)
      );

      // Map them to an object of market ID => market data.
      const marketsWithDailyVolume = Object.fromEntries(
        priceFeedDataForMarketsWithDailyVolume.map((mkt) => [mkt.market_id, mkt])
      );

      // Ensure the total number of markets and their IDs have been preserved.
      DEBUG_ASSERT(() => {
        const keysWithVolume = Object.keys(marketsWithDailyVolume);
        const keysWithoutVolume = Object.keys(marketsWithoutDailyVolume);
        const allKeys = new Set([...keysWithVolume, ...keysWithoutVolume]);
        return allKeys.size === keysWithVolume.length + keysWithoutVolume.length;
      });

      // Return an array with all the final market data using the original ordering.
      return originalOrdering.map((market_id) =>
        market_id in marketsWithDailyVolume
          ? marketsWithDailyVolume[market_id]
          : marketsWithoutDailyVolume[market_id]
      );
    });
  },
  ["stats-markets"],
  {
    revalidate: 10,
  }
);

export default fetchCachedPaginatedMarketStats;
