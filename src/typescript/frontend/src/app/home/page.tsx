import { DYNAMIC_FETCHERS } from "app/internal/dynamic-fetcher";
import { AptPriceContextProvider } from "context/AptPrice";
import FEATURE_FLAGS from "lib/feature-flags";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";

// import { cookies } from "next/headers";
import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis } from "@/sdk/emoji_data";
import { ORDER_BY, toMarketStateModel } from "@/sdk/indexer-v2";
import { type DatabaseModels, toPriceFeed } from "@/sdk/indexer-v2/types";

import { convertMeleeData } from "../arena/fetch-melee-data";
import HomePageComponent from "./HomePage";
import { cachedHomePageMarketStateQuery } from "./queries";

export const revalidate = 10;
// export const dynamic = "error";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = undefined; //q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  // General market data queries
  // ---------------------------------------
  const priceFeedPromise = DYNAMIC_FETCHERS["price-feed"]()
    .then((res) => res.map(toPriceFeed))
    .catch((err) => {
      console.error(err);
      return [] as DatabaseModels["price_feed"][];
    });
  const aptPricePromise = DYNAMIC_FETCHERS["apt-price"]();
  const numMarketsPromise = DYNAMIC_FETCHERS["num-markets"]();
  const meleeDataPromise = FEATURE_FLAGS.Arena
    ? DYNAMIC_FETCHERS["arena/melee-data"]()
        .then(convertMeleeData)
        .then((res) => (res.arenaInfo ? res : null))
        .catch(() => null)
    : null;

  // Favorites
  // ---------------------------------------
  // cookies() can only be used in this file, otherwise the build command fails, even when using "server-only".
  // const serverCookies = new CookieUserSettingsManager(cookies());
  // First check user settings in cookies to check the filter status.
  // const { accountAddress, homePageFilterFavorites: favoritesSettingFromCookies } =
  // serverCookies.getSettings();
  // Fetch favorites, and ignore the favorites preference if there is a search query.
  const favorites = [];
  // !q && accountAddress && favoritesSettingFromCookies ? await getFavorites(accountAddress) : [];

  // Cache the market states query if there are no params that make the query too unique to be cached effectively.
  // Note that the order is always descending on the home page.
  const filterByFavorites = favorites.length;
  const isCacheable = false; //!searchEmojis?.length && !filterByFavorites;
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

  const [priceFeedData, markets, numMarkets, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise.catch(() => []),
    marketsPromise.catch(() => []),
    numMarketsPromise.catch(() => 0),
    aptPricePromise.catch(() => undefined),
    meleeDataPromise,
  ]);

  return (
    <AptPriceContextProvider aptPrice={aptPrice ?? undefined}>
      <HomePageComponent
        markets={markets}
        numMarkets={numMarkets}
        page={page}
        sortBy={sortBy}
        searchBytes={q}
        priceFeed={priceFeedData}
        meleeData={meleeData}
        isFavoriteFilterEnabled={false} //{!!favoritesSettingFromCookies && favorites.length > 0}
      />
    </AptPriceContextProvider>
  );
}
