import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
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

export const revalidate = 1;
export const fetchCache = "default-cache";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const numRegisteredMarkets = await fetchNumRegisteredMarkets();
  const featured = await fetchFeaturedMarket();
  const markets = await fetchMarkets({
    page,
    sortBy,
    orderBy,
    searchEmojis,
    pageSize: MARKETS_PER_PAGE,
  });
  const priceFeed = await fetchPriceFeed({});

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
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
