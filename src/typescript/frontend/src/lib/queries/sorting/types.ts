import { DEFAULT_SORT_BY, SortMarketsBy } from "@/sdk/indexer-v2/types/common";

export type MarketDataSortByHomePage =
  | SortMarketsBy.MarketCap
  | SortMarketsBy.BumpOrder
  | SortMarketsBy.DailyVolume
  | SortMarketsBy.AllTimeVolume;

const sortByFilters = {
  [SortMarketsBy.MarketCap]: {
    forPageQueryParams: "market_cap",
    forPostgrestQuery: "market_cap",
  },
  [SortMarketsBy.BumpOrder]: {
    forPageQueryParams: "bump",
    forPostgrestQuery: "bump_time",
  },
  [SortMarketsBy.DailyVolume]: {
    forPageQueryParams: "daily_vol",
    forPostgrestQuery: "daily_volume",
  },
  [SortMarketsBy.AllTimeVolume]: {
    forPageQueryParams: "all_time_vol",
    forPostgrestQuery: "all_time_volume",
  },
  [SortMarketsBy.Price]: {
    forPageQueryParams: "price",
    forPostgrestQuery: "last_swap_avg_execution_price_q64",
  },
  [SortMarketsBy.Apr]: {
    forPageQueryParams: "apr",
    forPostgrestQuery: "one_day_tvl_per_lp_coin_growth_q64",
  },
  [SortMarketsBy.Tvl]: {
    forPageQueryParams: "tvl",
    forPostgrestQuery: "cpamm_real_reserves_quote",
  },
} as const;

export type SortByPageQueryParams =
  | "market_cap"
  | "bump"
  | "daily_vol"
  | "all_time_vol"
  | "price"
  | "apr"
  | "tvl";
type SortByPostgrestQueryParams =
  | "market_cap"
  | "bump_time"
  | "daily_volume"
  | "all_time_volume"
  | "last_swap_avg_execution_price_q64"
  | "one_day_tvl_per_lp_coin_growth_q64"
  | "cpamm_real_reserves_quote";

const toMarketDataSortBy = (
  sortBy?: SortByPostgrestQueryParams | SortMarketsBy | SortByPageQueryParams
): SortMarketsBy => {
  for (const key of Object.keys(sortByFilters)) {
    if (sortBy === sortByFilters[key]?.forPostgrestQuery) return key as SortMarketsBy;
    if (sortBy === sortByFilters[key]?.forPageQueryParams) return key as SortMarketsBy;
    if (sortBy === key) return key as SortMarketsBy;
  }
  return DEFAULT_SORT_BY;
};

export const toMarketDataSortByHomePage = (
  sortBy?: SortByPageQueryParams | SortMarketsBy | SortByPostgrestQueryParams
): MarketDataSortByHomePage => {
  const sort = toMarketDataSortBy(sortBy);
  if (sort === SortMarketsBy.MarketCap) return sort;
  if (sort === SortMarketsBy.BumpOrder) return sort;
  if (sort === SortMarketsBy.DailyVolume) return sort;
  if (sort === SortMarketsBy.AllTimeVolume) return sort;
  return DEFAULT_SORT_BY;
};
