import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
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

export const revalidate = 2;

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const featuredPromise = fetchFeaturedMarket();
  const priceFeedPromise = fetchPriceFeed({});

  let marketsPromise: ReturnType<typeof fetchMarkets>;

  let numMarketsPromise: Promise<number>;

  if (searchEmojis?.length) {
    const promise = fetchMarketsWithCount({
      page,
      sortBy,
      orderBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
      count: true,
    });
    marketsPromise = promise.then((r) => r.rows);
    numMarketsPromise = promise.then((r) => r.count!);
  } else {
    marketsPromise = fetchMarkets({
      page,
      sortBy,
      orderBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
    numMarketsPromise = fetchNumRegisteredMarkets();
  }

  const [featured, priceFeed, markets, numMarkets] = await Promise.all([
    featuredPromise,
    priceFeedPromise,
    marketsPromise,
    numMarketsPromise,
  ]);

  // Call this last because `headers()` is a dynamic API and all fetches after this aren't cached.
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
