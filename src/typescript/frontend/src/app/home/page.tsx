import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import {
  fetchMarkets,
  fetchMarketsWithCount,
  fetchNumRegisteredMarkets,
  fetchPriceFeedAndMarketData,
  type PriceFeedAndMarketData,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

export const revalidate = 2;

const getCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);

const stringifiedFetchPriceFeedData = () =>
  fetchPriceFeedAndMarketData().then((res) => stringifyJSON(res));

const getCachedPriceFeedData = unstable_cache(
  stringifiedFetchPriceFeedData,
  ["price-feed-with-market-data"],
  { revalidate: 10 }
);

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const priceFeedPromise = getCachedPriceFeedData()
    .then((res) => parseJSON<PriceFeedAndMarketData[]>(res))
    .catch((err) => {
      console.error(err);
      return [] as PriceFeedAndMarketData[];
    });

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

  const [priceFeedData, markets, numMarkets] = await Promise.all([
    priceFeedPromise,
    marketsPromise,
    numMarketsPromise,
  ]);

  return (
    <HomePageComponent
      markets={markets}
      numMarkets={numMarkets}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      priceFeed={priceFeedData}
    />
  );
}
