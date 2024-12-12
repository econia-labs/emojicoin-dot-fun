import { fetchNumRegisteredMarkets, fetchPriceFeedWithMarketState } from "@/queries/home";
import { toPriceFeed } from "@sdk/indexer-v2/types";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { ORDER_BY } from "@sdk/queries";
import StatsPageComponent from "./StatsPage";

export const revalidate = 60;
export const dynamic = "force-static";

// Nothing here is cached because we only revalidate this static page once every `revalidate` seconds.
export default async function Stats() {
  const numMarkets = fetchNumRegisteredMarkets();
  const priceFeedData = fetchPriceFeedWithMarketState({
    page: 1,
    orderBy: ORDER_BY.DESC,
    pageSize: 500,
    sortBy: SortMarketsBy.DailyVolume,
    count: true,
  }).then((res) => res.map(toPriceFeed));

  return <StatsPageComponent numMarkets={numMarkets} priceFeed={priceFeedData} />;
}
