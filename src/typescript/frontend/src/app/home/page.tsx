import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import {
  fetchMarkets,
  fetchMarketsWithCount,
  fetchNumRegisteredMarkets,
  fetchPriceFeedWithMarketState,
} from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";
import { type DatabaseModels, toPriceFeed } from "@sdk/indexer-v2/types";
import { type DatabaseJsonType } from "@sdk/indexer-v2/types/json-types";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { getAptPrice } from "lib/queries/get-apt-price";
import { AptPriceContextProvider } from "context/AptPrice";
import { ORDER_BY } from "@sdk/indexer-v2/const";
import { ARENA_MODULE_ADDRESS } from "@sdk/const";
import { fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";

export const revalidate = 2;

const getCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);

const NUM_MARKETS_ON_PRICE_FEED = 25;

const stringifiedFetchPriceFeedData = () =>
  fetchPriceFeedWithMarketState({
    sortBy: SortMarketsBy.DailyVolume,
    orderBy: ORDER_BY.DESC,
    pageSize: NUM_MARKETS_ON_PRICE_FEED,
  }).then((res) => stringifyJSON(res));

const getCachedPriceFeedData = unstable_cache(
  stringifiedFetchPriceFeedData,
  ["price-feed-with-market-data"],
  { revalidate: 10 }
);

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const priceFeedPromise = getCachedPriceFeedData()
    .then((res) => parseJSON<DatabaseJsonType["price_feed"][]>(res).map((p) => toPriceFeed(p)))
    .catch((err) => {
      console.error(err);
      return [] as DatabaseModels["price_feed"][];
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

  const aptPricePromise = getAptPrice();

  const meleeDataPromise = (async () => {
    if (ARENA_MODULE_ADDRESS) {
      const melee = await fetchArenaInfo({});
      const [market0, market1] = await Promise.all([
        fetchMarketStateByAddress({ address: melee!.emojicoin0MarketAddress }),
        fetchMarketStateByAddress({ address: melee!.emojicoin1MarketAddress }),
      ]);
      return { melee: melee!, market0: market0!, market1: market1! };
    }
    return null;
  })();

  const [priceFeedData, markets, numMarkets, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise,
    marketsPromise,
    numMarketsPromise,
    aptPricePromise,
    meleeDataPromise,
  ]).catch((e) => {
    console.error(e);
    return [
      [] as DatabaseModels["price_feed"][],
      [] as DatabaseModels["market_state"][],
      0,
      undefined,
      null,
    ] as const;
  });

  return (
    <AptPriceContextProvider aptPrice={aptPrice}>
      <HomePageComponent
        markets={markets}
        numMarkets={numMarkets}
        page={page}
        sortBy={sortBy}
        searchBytes={q}
        priceFeed={priceFeedData}
        meleeData={meleeData}
      />
    </AptPriceContextProvider>
  );
}
