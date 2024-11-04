import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import {
  fetchFeaturedMarket,
  fetchMarkets,
  fetchMarketsWithCount,
  fetchNumRegisteredMarkets,
  fetchPriceFeed,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const featured = await fetchFeaturedMarket();
  let numMarkets: number;
  let markets: Awaited<ReturnType<typeof fetchMarketsWithCount>>['rows'];

  if (searchEmojis?.length) {
    const res = await fetchMarketsWithCount({
      page,
      sortBy,
      orderBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
      count: true,
    });
    numMarkets = res.count!;
    markets = res.rows;
  } else {
    numMarkets = await fetchNumRegisteredMarkets();
    markets = await fetchMarkets({
      page,
      sortBy,
      orderBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
  }

  const priceFeed = await fetchPriceFeed({});

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return (
    <HomePageComponent
      featured={featured}
      markets={markets}
      numMarkets={numMarkets}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      geoblocked={geoblocked}
      priceFeed={priceFeed}
    />
  );
}
