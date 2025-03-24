import { ORDER_BY } from "@sdk/indexer-v2/const";
import { SortMarketsBy } from "@sdk/indexer-v2/types";
import { unstable_cache } from "next/cache";

import { fetchPriceFeedWithMarketState } from "@/queries/home";

export const NUM_MARKETS_ON_PRICE_FEED = 25;

const fetchPriceFeed = () =>
  fetchPriceFeedWithMarketState({
    sortBy: SortMarketsBy.DailyVolume,
    orderBy: ORDER_BY.DESC,
    pageSize: NUM_MARKETS_ON_PRICE_FEED,
  });

export const fetchCachedPriceFeed = unstable_cache(
  fetchPriceFeed,
  ["price-feed-with-market-data"],
  { revalidate: 10 }
);
