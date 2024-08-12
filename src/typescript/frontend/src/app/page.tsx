import fetchSortedMarketData, { fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import { MarketDataSortBy } from "lib/queries/sorting/types";
import HomePageComponent from "./home/HomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import { ORDER_BY } from "@sdk/queries/const";
import { headers } from "next/headers";
import { isBanned } from "utils/geolocation";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, inBondingCurve, q } = toHomePageParamsWithDefault(searchParams);

  const featured = await fetchFeaturedMarket({
    sortBy: MarketDataSortBy.DailyVolume,
    orderBy: ORDER_BY.DESC,
  });

  const geoblocked = await isBanned(headers().get("x-real-ip"));
  const sorted = await fetchSortedMarketData({
    page,
    sortBy,
    orderBy,
    inBondingCurve,
    exactCount: true,
    searchBytes: q,
  });

  return (
    <HomePageComponent
      featured={featured}
      markets={sorted.markets}
      count={sorted.count}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      geoblocked={geoblocked}
    />
  );
}
