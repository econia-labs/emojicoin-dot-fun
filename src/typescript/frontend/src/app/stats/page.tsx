import {
  fetchMarkets,
  fetchNumRegisteredMarkets,
  fetchPriceFeedWithMarketState,
} from "@/queries/home";
import { toPriceFeed } from "@sdk/indexer-v2/types";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { ORDER_BY } from "@sdk/queries";
import StatsPageComponent from "./StatsPage";
import { compareNumber } from "@sdk/utils";

export const revalidate = 60;
export const dynamic = "force-static";

// Nothing here is cached because we only revalidate this static page once every `revalidate` seconds.
export default async function Stats() {
  const numMarketsPromise = fetchNumRegisteredMarkets();

  const commonArgs = {
    page: 1,
    orderBy: ORDER_BY.DESC,
    pageSize: 500,
  };

  const priceFeedDataPromise = fetchPriceFeedWithMarketState({
    ...commonArgs,
    sortBy: SortMarketsBy.DailyVolume,
  })
    .then((res) => res.map(toPriceFeed))
    .then((res) => res.toSorted((a, b) => compareNumber(a.deltaPercentage, b.deltaPercentage)));

  const fetchMarketsBy = (sortBy: SortMarketsBy) => fetchMarkets({ ...commonArgs, sortBy });

  const dailyVolumeDataPromise = fetchMarketsBy(SortMarketsBy.DailyVolume);
  const marketCapDataPromise = fetchMarketsBy(SortMarketsBy.MarketCap);
  const allTimeVolumeDataPromise = fetchMarketsBy(SortMarketsBy.AllTimeVolume);
  const latestPricesDataPromise = fetchMarketsBy(SortMarketsBy.Price);
  const tvlDataPromise = fetchMarketsBy(SortMarketsBy.Tvl);

  const [
    numMarkets,
    dailyVolumeData,
    priceFeedData,
    marketCapData,
    allTimeVolumeData,
    latestPricesData,
    tvlData,
  ] = await Promise.all([
    numMarketsPromise,
    dailyVolumeDataPromise,
    priceFeedDataPromise,
    marketCapDataPromise,
    allTimeVolumeDataPromise,
    latestPricesDataPromise,
    tvlDataPromise,
  ]);

  const props = {
    numMarkets,
    dailyVolumeData,
    priceFeedData,
    marketCapData,
    allTimeVolumeData,
    latestPricesData,
    tvlData,
  };

  return <StatsPageComponent {...props} />;
}
