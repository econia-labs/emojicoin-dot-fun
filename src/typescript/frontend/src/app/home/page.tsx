import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./HomePage";
import { fetchMarkets, fetchMarketsWithCount } from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type DatabaseModels, toPriceFeed } from "@sdk/indexer-v2/types";
import { getAptPrice } from "lib/queries/get-apt-price";
import { AptPriceContextProvider } from "context/AptPrice";
import { getCachedNumMarketsFromAptosNode } from "lib/queries/num-market";
import { fetchCachedPriceFeed } from "lib/queries/price-feed";
import { ARENA_MODULE_ADDRESS } from "@sdk/const";
import { fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";

export const revalidate = 2;

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const priceFeedPromise = fetchCachedPriceFeed()
    .then((res) => res.map(toPriceFeed))
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
      if (!melee) {
        console.error("Arena is enabled, but arena info couldn't be fetched from the database.");
        return null;
      }
      const [market0, market1] = await Promise.all([
        fetchMarketStateByAddress({ address: melee.emojicoin0MarketAddress }),
        fetchMarketStateByAddress({ address: melee.emojicoin1MarketAddress }),
      ]);
      if (!market0 || !market1) {
        console.error(
          "Arena info found, but one or both of the arena markets aren't in the market state table."
        );
        return null;
      }
      return { melee, market0, market1 };
    }
    return null;
  })();

  const [priceFeedData, markets, numMarkets, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise.catch(() => []),
    marketsPromise.catch(() => []),
    numMarketsPromise.catch(() => 0),
    aptPricePromise.catch(() => undefined),
    meleeDataPromise.catch(() => null),
  ]);

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
