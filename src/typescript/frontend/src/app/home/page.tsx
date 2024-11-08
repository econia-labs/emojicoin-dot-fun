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
import { logFetch } from "lib/logging";

export const revalidate = 2;

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const numRegisteredMarkets = await logFetch(
    "fetchNumRegisteredMarkets",
    fetchNumRegisteredMarkets
  );
  const featured = await logFetch("fetchFeaturedMarket", fetchFeaturedMarket);
  const markets = await logFetch("fetchMarkets", fetchMarkets, {
    page,
    sortBy,
    orderBy,
    searchEmojis,
    pageSize: MARKETS_PER_PAGE,
  });
  const priceFeed = await logFetch("fetchPriceFeed", fetchPriceFeed, {});

  // Call this last because `headers()` is a dynamic API and all fetches after this aren't cached.
  const geoblocked = await logFetch("isUserGeoblocked", isUserGeoblocked, {
    ip: headers().get("x-real-ip"),
  });
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
