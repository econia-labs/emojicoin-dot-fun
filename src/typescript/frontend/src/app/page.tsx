import fetchSortedMarketData, { fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import { revalidatePath } from "next/cache";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";
import HomePageComponent from "./home/HomePage";
import { REVALIDATION_TIME } from "lib/server-env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, inBondingCurve, q } = toHomePageParamsWithDefault(searchParams);

  const featured = await fetchFeaturedMarket({ sortBy, orderBy, inBondingCurve, searchBytes: q });
  const sorted = await fetchSortedMarketData({
    page,
    sortBy,
    orderBy,
    inBondingCurve,
    exactCount: true,
    searchBytes: q,
  });

  revalidatePath("/");

  return (
    <HomePageComponent
      featured={featured}
      markets={sorted.markets}
      count={sorted.count}
      page={page}
      sortBy={toMarketDataSortByHomePage(sortBy)}
      searchBytes={q === "0x" ? undefined : q}
    />
  );
}
