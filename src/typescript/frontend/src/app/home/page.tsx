import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import {
  fetchFeaturedMarket,
  fetchMarkets,
  fetchNumRegisteredMarkets,
  fetchPriceFeed,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { ROUTES } from "router/routes";
import { redirect } from "next/navigation";
import type { QueryType } from "utils";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));

  let numRegisteredMarkets: QueryType<typeof fetchNumRegisteredMarkets>;
  let featured: QueryType<typeof fetchFeaturedMarket>;
  let markets: QueryType<typeof fetchMarkets>;
  let priceFeed: QueryType<typeof fetchPriceFeed>;

  try {
    numRegisteredMarkets = await fetchNumRegisteredMarkets();
    featured = await fetchFeaturedMarket();
    markets = await fetchMarkets({
      page,
      sortBy,
      orderBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
    priceFeed = await fetchPriceFeed({});
  } catch (e) {
    console.error(e);
    redirect(ROUTES.maintenance);
  }

  return (
    <HomePageComponent
      featured={featured}
      markets={markets}
      numRegisteredMarkets={numRegisteredMarkets}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      geoblocked={geoblocked}
      priceFeed={priceFeed}
    />
  );
}
