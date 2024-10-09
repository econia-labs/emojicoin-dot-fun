import {
  fetchNumRegisteredMarkets,
  fetchFeaturedMarket,
  fetchMarkets,
  fetchPriceFeed,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";
import { type HomePageProps } from "./HomePage";
import { type HomePageSearchParams } from "lib/queries/sorting/query-params";

export const fetchHomePageProps = async (
  searchParams?: HomePageSearchParams
): Promise<HomePageProps> => {
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

  return {
    featured,
    markets,
    numRegisteredMarkets,
    page,
    sortBy,
    searchBytes: q,
    geoblocked,
    priceFeed,
  };
};
