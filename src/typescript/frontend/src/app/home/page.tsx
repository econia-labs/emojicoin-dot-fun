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

import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis } from "@/sdk/emoji_data";
import { ORDER_BY, toMarketStateModel } from "@/sdk/indexer-v2";
import { type DatabaseModels, toPriceFeed } from "@/sdk/indexer-v2/types";

import { fetchCachedMeleeData } from "../arena/fetch-melee-data";
import HomePageComponent from "./HomePage";
import { cachedHomePageMarketStateQuery } from "./queries";

export default async function Home({ searchParams }: HomePageParams) {
  // cookies() can only be used in this file, otherwise the build command fails, even when using "server-only".
  // Note that all fetch requests below the `cookies()` function call is considered dynamic and is thus not cached
  // by default. Thus all fetches below this that should be cached must be cached with `unstable_cache`.
  const serverCookies = new CookieUserSettingsManager(cookies());

  const { page, sortBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  // We first check user settings in cookies to check the filter status.
  const { accountAddress, homePageFilterFavorites: favoritesSettingFromCookies } =
    serverCookies.getSettings();
  // Then we check if the filter is present in the URL in case it was changed during this session.
  const favoritesSettingFromSearchParams = searchParams?.favorites === "true";

  // Don't filter favorites if there is a search query.
  const favorites =
    !q && accountAddress && (favoritesSettingFromCookies || favoritesSettingFromSearchParams)
      ? await getFavorites(accountAddress)
      : [];

  const priceFeedPromise = fetchCachedPriceFeed()
    .then((res) => res.map(toPriceFeed))
    .catch((err) => {
      console.error(err);
      return [] as DatabaseModels["price_feed"][];
    });

  // Cache the market states query if there are no params that make the query too unique to be cached effectively.
  // Note that the order is always descending on the home page.
  const filterByFavorites = favorites.length;
  const isCacheable = !searchEmojis?.length && !filterByFavorites;
  const marketsPromise = isCacheable
    ? cachedHomePageMarketStateQuery({ page, sortBy }).then((res) => res.map(toMarketStateModel))
    : fetchMarkets({
        // The page is always 1 if filtering by favorites.
        page: filterByFavorites ? 1 : page,
        sortBy,
        // The home page always sorts by queries in descending order.
        orderBy: ORDER_BY.DESC,
        searchEmojis,
        selectEmojis: favorites.map((emojiBytes) =>
          symbolBytesToEmojis(emojiBytes).emojis.map((e) => e.emoji)
        ),
        pageSize: MARKETS_PER_PAGE,
      });

  const numMarketsPromise = fetchCachedNumMarketsFromAptosNode();

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
