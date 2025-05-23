import { AptPriceContextProvider } from "context/AptPrice";
import { CookieUserSettingsManager } from "lib/cookie-user-settings/cookie-user-settings-common";
import FEATURE_FLAGS from "lib/feature-flags";
import { getAptPrice } from "lib/queries/get-apt-price";
import { getFavorites } from "lib/queries/get-favorite-markets";
import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";
import { fetchCachedPriceFeed } from "lib/queries/price-feed";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import { cookies } from "next/headers";

import { fetchMarkets, fetchMarketsWithCount } from "@/queries/home";
import { symbolBytesToEmojis } from "@/sdk/emoji_data";
import { type DatabaseModels, toPriceFeed } from "@/sdk/indexer-v2/types";

import { fetchCachedMeleeData } from "../arena/fetch-melee-data";
import HomePageComponent from "./HomePage";

export const revalidate = 2;

export default async function Home({ searchParams }: HomePageParams) {
  // cookies() can only be used here. The build command fails if this is in a different file, even when using "server-only".
  const serverCookies = new CookieUserSettingsManager(cookies());

  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  // We first check user settings in cookies to check the filter status.
  const { accountAddress, homePageFilterFavorites } = serverCookies.getSettings();
  // Then we check if the filter is present in the URL in case it was changed during this session.
  const isFilterFavorites = searchParams?.isFilterFavorites === "true";

  // Don't filter favorites if there is a search query.
  const favorites =
    !q && accountAddress && (homePageFilterFavorites || isFilterFavorites)
      ? await getFavorites(accountAddress)
      : [];

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
      selectEmojis: favorites.map((emojiBytes) =>
        symbolBytesToEmojis(emojiBytes).emojis.map((e) => e.emoji)
      ),
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
      selectEmojis: favorites.map((emojiBytes) =>
        symbolBytesToEmojis(emojiBytes).emojis.map((e) => e.emoji)
      ),
      pageSize: MARKETS_PER_PAGE,
    });
    numMarketsPromise = fetchCachedNumMarketsFromAptosNode();
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
        isFavoriteFilterEnabled={favorites.length > 0}
      />
    </AptPriceContextProvider>
  );
}
