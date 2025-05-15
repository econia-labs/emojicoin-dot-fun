import { fetchPriceFeedWithMarketState, type OrderBy } from "@/sdk/indexer-v2";

import { STATS_MARKETS_PER_PAGE, type StatsColumn } from "./schema";

export async function fetchMarketsBy(args: {
  page: number;
  sortBy: StatsColumn;
  orderBy: OrderBy;
}) {
  return fetchPriceFeedWithMarketState({
    ...args,
    pageSize: STATS_MARKETS_PER_PAGE,
  });
}
