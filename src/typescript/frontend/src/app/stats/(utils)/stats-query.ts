import "server-only";

import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import type { DatabaseJsonType } from "@/sdk/index";
import {
  fetchPriceFeedWithMarketState,
  fetchPriceFeedWithMarketStateAndNulls,
  toOrderBy,
} from "@/sdk/indexer-v2";

import type { StatsSchemaOutput } from "./schema";
import { STATS_MARKETS_PER_PAGE } from "./schema";

export async function fetchPaginatedMarketStats(
  args: StatsSchemaOutput & { pageSize: number }
): Promise<DatabaseJsonType["price_feed_with_nulls"][]> {
  const { sort, order, pageSize } = args;
  const orderBy = toOrderBy(order);

  // If sorting by the price delta percentage, simply query the `price_feed` table.
  // This automatically filters markets with `null` values for the price delta related columns.
  // Without using this query specifically here, sorting by price delta would show markets
  // with nulled `delta_percentage` columns first when sorting by the delta percentage DESC,
  // which would be undesirable and cumbersome to deal with.
  if (sort === "delta") {
    return fetchPriceFeedWithMarketState({ ...args, sortBy: "delta", orderBy, pageSize });
  }

  // Otherwise, return market state data sorted by `sortBy`, but with possibly null fields for
  // the price delta related columns.
  return fetchPriceFeedWithMarketStateAndNulls({ ...args, sortBy: sort, orderBy, pageSize });
}

/**
 * Fetches the cached, paginated market state stats query.
 *
 * Normalizes all queries into the final output of the price feed query.
 *
 * NOTE: This does not perform input validation on the page number. Always validate the `page` input
 * param before calling this function.
 */
const fetchCachedPaginatedMarketStats = unstableCacheWrapper(
  async (args: StatsSchemaOutput) =>
    fetchPaginatedMarketStats({ ...args, pageSize: STATS_MARKETS_PER_PAGE }),
  ["paginated-market-stats"],
  {
    revalidate: 10,
    tags: ["paginated-market-stats"],
  }
);

export default fetchCachedPaginatedMarketStats;
