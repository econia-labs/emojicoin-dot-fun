import { fetchCachedMeleeData } from "app/arena/fetch-melee-data";
import FEATURE_FLAGS from "lib/feature-flags";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchCachedAptPrice } from "lib/queries/get-apt-price";
import { fetchCachedNumRegisteredMarkets, fetchIsValidPageNumber } from "lib/queries/num-market";
import { fetchCachedHomePagePriceFeed } from "lib/queries/price-feed";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";

import { fetchMarketsJson } from "@/queries/home";
import type { MarketStateModel, MarketStateQueryArgs } from "@/sdk/index";
import { ORDER_BY, toMarketStateModel } from "@/sdk/indexer-v2";
import { type DatabaseModels, toPriceFeed } from "@/sdk/indexer-v2/types";

/**
 * Restrict the cacheable function to the query params that are desirable for caching responses for.
 */
const cacheableMarketStateQuery = ({
  page,
  sortBy,
}: Pick<MarketStateQueryArgs, "page" | "sortBy">) =>
  fetchMarketsJson({ page, sortBy, orderBy: ORDER_BY.DESC, pageSize: MARKETS_PER_PAGE });

export const cachedHomePageMarketStateQuery = unstableCacheWrapper(
  cacheableMarketStateQuery,
  ["cacheable-market-state-queries"],
  {
    revalidate: 2,
    tags: ["cacheable-market-state-queries"],
  }
);

export async function fetchHomePageData(args: { sort: string; page: string }) {
  const sortBy = toMarketDataSortByHomePage(args.sort as SortByPageQueryParams);
  const page = safeParsePageWithDefault(args.page);

  if (page < 1) return { notFound: true } as const;

  const isValid = page === 1 || (await fetchIsValidPageNumber(page).catch((_e) => false));
  if (!isValid) {
    return { notFound: true } as const;
  }

  const priceFeedPromise = fetchCachedHomePagePriceFeed()
    .then((res) => res.map(toPriceFeed))
    .catch((err) => {
      console.error(err);
      return [] as DatabaseModels["price_feed"][];
    });
  const numMarketsPromise = fetchCachedNumRegisteredMarkets();
  const aptPricePromise = fetchCachedAptPrice();
  const meleeDataPromise = FEATURE_FLAGS.Arena
    ? fetchCachedMeleeData()
        .then((res) => (res.arenaInfo ? res : null))
        .catch(() => null)
    : null;

  const marketsPromise = cachedHomePageMarketStateQuery({ page, sortBy }).then((res) =>
    res.map(toMarketStateModel)
  );

  const [priceFeedData, markets, numMarkets, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise.catch(() => []),
    marketsPromise.catch(() => [] as MarketStateModel[]),
    numMarketsPromise.catch(() => 0),
    aptPricePromise.catch(() => undefined),
    meleeDataPromise,
  ]);

  return {
    notFound: false,
    data: {
      markets,
      numMarkets,
      page,
      sortBy,
      priceFeed: priceFeedData,
      meleeData,
      aptPrice,
    },
  } as const;
}
