import { type Period } from "../../const";
import { type OrderBy } from "../../queries/const";
import { type AnyNumberString } from "../../types";

export enum SortMarketsBy {
  MarketCap = "market_cap",
  BumpOrder = "bump",
  DailyVolume = "daily_vol",
  AllTimeVolume = "all_time_vol",
  Price = "price",
  Apr = "apr",
  Tvl = "tvl",
}

export const DEFAULT_SORT_BY = SortMarketsBy.BumpOrder;

export type MarketStateQueryArgs = {
  sortBy?: SortMarketsBy;
  page?: number;
  pageSize?: number;
  orderBy?: OrderBy;
  searchEmojis?: string[];
  inBondingCurve?: boolean;
  count?: boolean;
};

export type PeriodicStateEventQueryArgs = {
  marketID: AnyNumberString;
  start: Date;
  end: Date;
  period: Period;
} & Omit<MarketStateQueryArgs, "page" | "pageSize" | "searchEmojis" | "sortBy" | "orderBy">;
