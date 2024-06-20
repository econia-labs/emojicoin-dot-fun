import { type ORDER_BY, type OrderByStrings } from "@sdk/queries/const";
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

export type GetSortedMarketDataQueryArgs = {
  limit?: number;
  offset: number;
  orderBy: OrderByStrings | ValueOf<typeof ORDER_BY>;
  sortBy: MarketDataSortBy | SortByPostgrestQueryParams;
  inBondingCurve: boolean | null;
  count?: boolean;
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
    forPostgrestQuery: "avg_execution_price_q64",
  },
  [MarketDataSortBy.Apr]: {
    forPageQueryParams: "apr",
    forPostgrestQuery: "tvl_per_lp_coin_growth_q64",
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
  | "avg_execution_price_q64"
  | "tvl_per_lp_coin_growth_q64"
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
