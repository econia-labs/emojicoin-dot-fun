import { type ORDER_BY, type OrderByStrings } from "@sdk/queries/const";
import { type ValueOf } from "@sdk/utils/utility-types";

export enum MarketDataSortBy {
  MarketCap = "market_cap",
  BumpOrder = "bump",
  DailyVolume = "daily_vol",
  AllTimeVolume = "all_time_vol",
  Price = "price",
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
} as const;

export type SortByPageQueryParams = "market_cap" | "bump" | "daily_vol" | "all_time_vol" | "price";
export type SortByPostgrestQueryParams =
  | "market_cap"
  | "bump_time"
  | "daily_volume"
  | "all_time_volume"
  | "avg_execution_price_q64";

export const toPageQueryParam = (
  sortBy: SortByPostgrestQueryParams | MarketDataSortBy | SortByPageQueryParams
): SortByPageQueryParams => {
  // TODO: Remove later.
  if (!sortByFilters[sortBy]) {
    console.warn("Incorrect enum/string value passed to query/param conversion function");
  }
  return sortByFilters[sortBy].forPageQueryParams ?? undefined;
};

export const toPostgrestQueryParam = (
  sortBy: SortByPageQueryParams | MarketDataSortBy | SortByPostgrestQueryParams
): SortByPostgrestQueryParams => {
  // TODO: Remove later.
  if (!sortByFilters[sortBy]) {
    console.warn("Incorrect enum/string value passed to query/param conversion function");
  }
  return sortByFilters[sortBy]?.forPostgrestQuery ?? undefined;
};
