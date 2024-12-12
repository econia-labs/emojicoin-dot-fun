import {
  fetchMarkets,
  fetchNumRegisteredMarkets,
  fetchPriceFeedWithMarketState,
} from "@/queries/home";
import { toPriceFeed } from "@sdk/indexer-v2/types";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { ORDER_BY } from "@sdk/queries";
import StatsPageComponent from "./StatsPage";

export const revalidate = 60;
export const dynamic = "force-static";

// Nothing here is cached because we only revalidate this static page once every `revalidate` seconds.
export default async function Stats() {
  const numMarkets = fetchNumRegisteredMarkets();

  const commonArgs = {
    page: 1,
    orderBy: ORDER_BY.DESC,
    pageSize: 500,
  };

  // This is essentially a daily volume fetch but with price feed data.
  const priceFeedData = fetchPriceFeedWithMarketState({
    ...commonArgs,
    sortBy: SortMarketsBy.DailyVolume,
  }).then((res) => res.map(toPriceFeed));
  // keep calling until it's done

  // then sum the volume for cumulative daily volume

  const fetchMarketsBy = (sortBy: SortMarketsBy) => fetchMarkets({ ...commonArgs, sortBy });

  const marketCapData = fetchMarketsBy(SortMarketsBy.MarketCap);
  const allTimeVolumeData = fetchMarketsBy(SortMarketsBy.AllTimeVolume);
  const latestPricesData = fetchMarketsBy(SortMarketsBy.Price);
  const tvlData = fetchMarketsBy(SortMarketsBy.Tvl);

  const props = {
    numMarkets,
    priceFeedData,
    marketCapData,
    allTimeVolumeData,
    latestPricesData,
    tvlData,
  };

  return <StatsPageComponent {...props} />;
}
