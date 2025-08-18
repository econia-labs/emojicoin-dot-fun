import { fetchPriceFeedWithMarketState } from "@/queries/home";
import { ORDER_BY } from "@/sdk/indexer-v2/const";
import { SortMarketsBy } from "@/sdk/indexer-v2/types";

export const fetchPriceFeed = async () => {
  const NUM_MARKETS_ON_PRICE_FEED = 25;
  return await fetchPriceFeedWithMarketState({
    sortBy: SortMarketsBy.DailyVolume,
    orderBy: ORDER_BY.DESC,
    pageSize: NUM_MARKETS_ON_PRICE_FEED,
  });
};
