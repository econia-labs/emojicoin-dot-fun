import "server-only";

import { unstable_cache } from "next/cache";

import type { DatabaseJsonType } from "@/sdk/index";
import {
  fetchPriceFeedWithMarketState,
  fetchPriceFeedWithMarketStateAndNulls,
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
  async (args: StatsSchemaOutput): Promise<DatabaseJsonType["price_feed_with_nulls"][]> => {
    const { sortBy } = args;
    const pageSize = STATS_MARKETS_PER_PAGE;

    // If sorting by the price delta percentage, simply query the `price_feed` table.
    // This automatically filters markets with `null` values for the price delta related columns.
    // Without using this query specifically here, sorting by price delta would show markets
    // with nulled `delta_percentage` columns first when sorting by the delta percentage DESC,
    // which would be undesirable and cumbersome to deal with.
    if (sortBy === "delta") {
      return fetchPriceFeedWithMarketState({ ...args, pageSize });
    }

    // Otherwise, return market state data sorted by `sortBy`, but with possibly null fields for
    // the price delta related columns.
    return fetchPriceFeedWithMarketStateAndNulls({ ...args, sortBy, pageSize });
  },
  ["stats-markets"],
  {
    revalidate: 10,
    tags: ["stats-markets"],
  }
);

export default fetchCachedPaginatedMarketStats;
