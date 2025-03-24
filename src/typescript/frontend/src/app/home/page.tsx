import { AptPriceContextProvider } from "context/AptPrice";
import FEATURE_FLAGS from "lib/feature-flags";
import { getAptPrice } from "lib/queries/get-apt-price";
import { getCachedNumMarketsFromAptosNode } from "lib/queries/num-market";
import { fetchCachedPriceFeed } from "lib/queries/price-feed";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";

import { fetchMarkets, fetchMarketsWithCount } from "@/queries/home";
import { symbolBytesToEmojis } from "@/sdk/emoji_data";
import { type DatabaseModels, toPriceFeed } from "@/sdk/indexer-v2/types";

import { fetchCachedMeleeData } from "./fetch-melee-data";
import HomePageComponent from "./HomePage";

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

  const meleeDataPromise = FEATURE_FLAGS.Arena
    ? fetchCachedMeleeData()
        .then((res) => (res.arenaInfo ? res : null))
        .catch(() => null)
    : null;

  const [priceFeedData, markets, numMarkets, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise.catch(() => []),
    marketsPromise.catch(() => []),
    numMarketsPromise.catch(() => 0),
    aptPricePromise.catch(() => undefined),
    meleeDataPromise,
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
