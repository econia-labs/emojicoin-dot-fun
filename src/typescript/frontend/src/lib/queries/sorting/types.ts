import { type ORDER_BY } from "@sdk/queries/const";
import { type ValueOf } from "@sdk/utils/utility-types";

export enum MarketDataSortBy {
  MarketCap = "market_cap",
  BumpOrder = "bump",
  DailyVolume = "daily_vol",
  AllTimeVolume = "all_time_vol",
  Price = "price",
  Apr = "apr",
  Tvl = "tvl",
}

export type MarketDataSortByHomePage =
  | MarketDataSortBy.MarketCap
  | MarketDataSortBy.BumpOrder
  | MarketDataSortBy.DailyVolume
  | MarketDataSortBy.AllTimeVolume;

export type GetSortedMarketDataQueryArgs = {
  limit?: number;
  offset: number;
  orderBy: ValueOf<typeof ORDER_BY>;
  sortBy: MarketDataSortBy | SortByPostgrestQueryParams;
  inBondingCurve?: boolean;
  exactCount?: boolean;
  searchBytes?: string;
};

export type GetMySortedMarketDataQueryArgs = Omit<
  GetSortedMarketDataQueryArgs,
  "exactCount" | "inBondingCurve"
> & {
  account?: string;
};

export const sortByFilters = {
  [MarketDataSortBy.MarketCap]: {
    forPageQueryParams: "market_cap",
    forPostgrestQuery: "market_cap",
  },
  [MarketDataSortBy.BumpOrder]: {
    forPageQueryParams: "bump",
    forPostgrestQuery: "bump_time",
  },
  [MarketDataSortBy.DailyVolume]: {
    forPageQueryParams: "daily_vol",
    forPostgrestQuery: "daily_volume",
  },
  [MarketDataSortBy.AllTimeVolume]: {
    forPageQueryParams: "all_time_vol",
    forPostgrestQuery: "all_time_volume",
  },
  [MarketDataSortBy.Price]: {
    forPageQueryParams: "price",
    forPostgrestQuery: "last_swap_avg_execution_price_q64",
  },
  [MarketDataSortBy.Apr]: {
    forPageQueryParams: "apr",
    forPostgrestQuery: "one_day_tvl_per_lp_coin_growth_q64",
  },
  [MarketDataSortBy.Tvl]: {
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
export type SortByPostgrestQueryParams =
  | "market_cap"
  | "bump_time"
  | "daily_volume"
  | "all_time_volume"
  | "last_swap_avg_execution_price_q64"
  | "one_day_tvl_per_lp_coin_growth_q64"
  | "cpamm_real_reserves_quote";

export const toPageQueryParam = (
  sortBy: SortByPostgrestQueryParams | MarketDataSortBy | SortByPageQueryParams
): SortByPageQueryParams => {
  return sortByFilters[sortBy].forPageQueryParams ?? sortBy;
};

export const toPostgrestQueryParam = (
  sortBy: SortByPageQueryParams | MarketDataSortBy | SortByPostgrestQueryParams
): SortByPostgrestQueryParams => {
  return sortByFilters[sortBy]?.forPostgrestQuery ?? sortBy;
};

export const toMarketDataSortBy = (
  sortBy?: SortByPostgrestQueryParams | MarketDataSortBy | SortByPageQueryParams
): MarketDataSortBy => {
  for (const key of Object.keys(sortByFilters)) {
    if (sortBy === sortByFilters[key]?.forPostgrestQuery) return key as MarketDataSortBy;
    if (sortBy === sortByFilters[key]?.forPageQueryParams) return key as MarketDataSortBy;
    if (sortBy === key) return key as MarketDataSortBy;
  }
  return MarketDataSortBy.MarketCap;
};

export const toMarketDataSortByHomePage = (
  sortBy?: SortByPageQueryParams | MarketDataSortBy | SortByPostgrestQueryParams
): MarketDataSortByHomePage => {
  const sort = toMarketDataSortBy(sortBy);
  if (sort === MarketDataSortBy.MarketCap) return sort;
  if (sort === MarketDataSortBy.BumpOrder) return sort;
  if (sort === MarketDataSortBy.DailyVolume) return sort;
  if (sort === MarketDataSortBy.AllTimeVolume) return sort;
  return MarketDataSortBy.MarketCap;
};
