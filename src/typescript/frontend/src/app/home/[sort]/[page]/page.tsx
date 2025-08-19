import { AptPriceContextProvider } from "context/AptPrice";
import { fetchCachedNumRegisteredMarkets } from "lib/queries/num-market";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import type { HomePageParams } from "lib/routes/home-page-params";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import NotFoundComponent from "@/components/pages/not-found";

import HomePageComponent from "../../HomePage";
import { fetchHomePageData } from "../../queries";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const numMarkets = await fetchCachedNumRegisteredMarkets();
  const maxPageNumber = getMaxPageNumber(numMarkets, MARKETS_PER_PAGE);
  return Array.from({ length: maxPageNumber }).flatMap((_, i) => {
    const pageNumber = `${i + 1}`;
    const slugs = [
      { sort: "bump", page: pageNumber },
      { sort: "all_time_vol", page: pageNumber },
      { sort: "daily_vol", page: pageNumber },
      { sort: "market_cap", page: pageNumber },
    ] as Array<{ sort: Exclude<SortByPageQueryParams, "price" | "apr" | "tvl">; page: string }>;

    return slugs.map(({ sort, page }) => ({ sort, page: page.toString() }));
  });
}

export default async function HomePageWithSlugs({ params }: HomePageParams) {
  const result = await fetchHomePageData(params);

  if (result.notFound) {
    return <NotFoundComponent />;
  }

  const { data } = result;

  return (
    <AptPriceContextProvider aptPrice={data.aptPrice}>
      <HomePageComponent {...data} />
    </AptPriceContextProvider>
  );
}
