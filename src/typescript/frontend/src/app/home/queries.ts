import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { unstable_cache } from "next/cache";

import { fetchMarketsJson } from "@/queries/home";
import type { MarketStateQueryArgs } from "@/sdk/index";
import { ORDER_BY } from "@/sdk/indexer-v2";

/**
 * Restrict the cacheable function to the query params that are desirable for caching responses for.
 */
const cacheableMarketStateQuery = ({
  page,
  sortBy,
}: Pick<MarketStateQueryArgs, "page" | "sortBy">) =>
  fetchMarketsJson({ page, sortBy, orderBy: ORDER_BY.DESC, pageSize: MARKETS_PER_PAGE });

export const cachedHomePageMarketStateQuery = unstable_cache(cacheableMarketStateQuery, [], {
  revalidate: 2,
  tags: ["cacheable-market-state-queries"],
});
