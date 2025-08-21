import type { convertJsonMeleeData } from "app/arena/fetch-melee-data";
import { fetchCachedMeleeData } from "app/arena/fetch-melee-data";
import FEATURE_FLAGS from "lib/feature-flags";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchCachedAptPrice } from "lib/queries/get-apt-price";
import { fetchCachedNumRegisteredMarkets } from "lib/queries/num-market";
import { fetchCachedHomePagePriceFeed } from "lib/queries/price-feed";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { MarketDataSortByHomePage, SortByPageQueryParams } from "lib/queries/sorting/types";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import { fetchMarketsJson } from "@/queries/home";
import type {
  DatabaseModels,
  MarketStateModel,
  MarketStateQueryArgs,
  PriceFeedModel,
} from "@/sdk/index";
import { ORDER_BY, toMarketStateModel } from "@/sdk/indexer-v2";
import { toPriceFeed } from "@/sdk/indexer-v2/types";

import { maybeGetHomePagePrebuildData } from "./prebuild-data";

/**
 * Restrict the cacheable function to the query params that are desirable for caching responses for.
 */
export const cacheableMarketStateQuery = ({
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

export type HomePageData =
  | {
      notFound: true;
    }
  | {
      notFound: false;
      data: {
        markets: MarketStateModel[];
        numMarkets: number;
        page: number;
        sortBy: MarketDataSortByHomePage;
        priceFeed: PriceFeedModel[];
        meleeData: Awaited<ReturnType<typeof convertJsonMeleeData>> | null;
        aptPrice: number | undefined;
      };
    };

export async function fetchHomePageData(args: {
  sort: string;
  page: string;
}): Promise<HomePageData> {
  const maybePrebuildData = maybeGetHomePagePrebuildData(args);
  if (maybePrebuildData) return maybePrebuildData;

  const sortBy = toMarketDataSortByHomePage(args.sort as SortByPageQueryParams);
  const page = safeParsePageWithDefault(args.page);

  if (page < 1) return { notFound: true } as const;

  const numMarketsPromise = fetchCachedNumRegisteredMarkets().then((n) => ({
    numMarkets: n,
    isValid: page <= getMaxPageNumber(n, MARKETS_PER_PAGE),
  }));
  const isValid = page === 1 || (await numMarketsPromise).isValid;
  if (!isValid) return { notFound: true } as const;

  const priceFeedPromise = fetchCachedHomePagePriceFeed()
    .then((res) => res.map(toPriceFeed))
    .catch((err) => {
      console.error(err);
      return [] as DatabaseModels["price_feed"][];
    });
  const aptPricePromise = fetchCachedAptPrice();
  const meleeDataPromise = FEATURE_FLAGS.Arena
    ? fetchCachedMeleeData()
        .then((res) => (res.arenaInfo ? res : null))
        .catch(() => null)
    : null;

  const marketsPromise = cachedHomePageMarketStateQuery({ page, sortBy }).then((res) =>
    res.map(toMarketStateModel)
  );

  const [priceFeedData, markets, { numMarkets }, aptPrice, meleeData] = await Promise.all([
    priceFeedPromise.catch(() => []),
    marketsPromise.catch(() => [] as MarketStateModel[]),
    numMarketsPromise.catch(() => ({ numMarkets: 0 })),
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
