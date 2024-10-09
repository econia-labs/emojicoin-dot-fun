import { type HomePageParams } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import { fetchHomePageProps } from "./fetch-props";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  return await fetchHomePageProps(searchParams).then((res) => (
    <HomePageComponent
      featured={res.featured}
      markets={res.markets}
      numRegisteredMarkets={res.numRegisteredMarkets}
      page={res.page}
      sortBy={res.sortBy}
      searchBytes={res.searchBytes}
      geoblocked={res.geoblocked}
      priceFeed={res.priceFeed}
    />
  ));
}
