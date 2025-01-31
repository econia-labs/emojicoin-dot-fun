import { fetchMarkets, fetchPriceFeedWithMarketState } from "@/queries/home";
import { toPriceFeed } from "@sdk/indexer-v2/types";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import StatsPageComponent from "./StatsPage";
import { compareNumber, getAptosClient } from "@sdk/utils";
import { RegistryView } from "@/contract-apis";
import { toRegistryView } from "@sdk-types";
import { ORDER_BY } from "@sdk/indexer-v2/const";

export const revalidate = 60;
export const dynamic = "force-static";

// Ensure a max number of pages fetched per query. Once we begin exceeding this amount (at 500 per page, this is 10000
// markets), we can switch over to a client-side pagination solution. For now, exhaustively querying the data server-
// side once every 60 seconds is fine.
const MAX_PAGES_PER_QUERY = 20;

// Nothing here is cached because we only revalidate this static page once every `revalidate` seconds.
export default async function Stats() {
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

  const fetchMarketsBy = (sortBy: SortMarketsBy, page: number) =>
    fetchMarkets({ ...commonArgs, sortBy, page });
  const paginateAll = async (sortBy: SortMarketsBy) => {
    const res: Awaited<ReturnType<typeof fetchMarketsBy>> = [];
    let page = 1;
    do {
      await fetchMarketsBy(sortBy, page).then((data) => res.push(...data));
      page += 1;
    } while (
      res.length !== 0 &&
      res.length % commonArgs.pageSize === 0 &&
      page <= MAX_PAGES_PER_QUERY
    );
    return res;
  };

  const dailyVolumeDataPromise = paginateAll(SortMarketsBy.DailyVolume);
  const marketCapDataPromise = paginateAll(SortMarketsBy.MarketCap);
  const allTimeVolumeDataPromise = paginateAll(SortMarketsBy.AllTimeVolume);
  const latestPricesDataPromise = paginateAll(SortMarketsBy.Price);
  const tvlDataPromise = paginateAll(SortMarketsBy.Tvl);
  const registryResourcePromise = RegistryView.view({ aptos: getAptosClient() }).then(
    toRegistryView
  );
  const [
    dailyVolumeData,
    priceFeedData,
    marketCapData,
    allTimeVolumeData,
    latestPricesData,
    tvlData,
    registryResource,
  ] = await Promise.all([
    dailyVolumeDataPromise,
    priceFeedDataPromise,
    marketCapDataPromise,
    allTimeVolumeDataPromise,
    latestPricesDataPromise,
    tvlDataPromise,
    registryResourcePromise,
  ]);

  const props = {
    numMarkets: Number(registryResource.numMarkets),
    dailyVolumeData,
    priceFeedData,
    marketCapData,
    allTimeVolumeData,
    latestPricesData,
    tvlData,
    registryResource,
  };

  return <StatsPageComponent {...props} />;
}
