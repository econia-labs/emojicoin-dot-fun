import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import {
  DEFAULT_FEATURED_BY,
  DEFAULT_ORDERED_BY_FOR_FEATURED_BY,
  fetchFeaturedMarket,
  fetchMarkets,
  fetchMarketsWithCount,
  fetchNumRegisteredMarkets,
  fetchPriceFeed,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { unstable_cache } from "next/cache";

export const revalidate = 2;

const getCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

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
    numMarketsPromise = getCachedNumMarketsFromAptosNode();
  }

  let featuredPromise: ReturnType<typeof fetchFeaturedMarket>;

  if (sortBy === DEFAULT_FEATURED_BY && orderBy === DEFAULT_ORDERED_BY_FOR_FEATURED_BY) {
    featuredPromise = marketsPromise.then((r) => r[0]);
  } else {
    featuredPromise = fetchFeaturedMarket();
  }

  const [featured, priceFeed, markets, numMarkets] = await Promise.all([
    featuredPromise,
    priceFeedPromise,
    marketsPromise,
    numMarketsPromise,
  ]);

  return (
    <HomePageComponent
      featured={featured}
      markets={markets}
      numMarkets={numMarkets}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      priceFeed={priceFeed}
    />
  );
}
