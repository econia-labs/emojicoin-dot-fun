import { type Period } from "../../const";
import { type OrderBy } from "../../queries/const";
import { AnyNumberString } from "../../types";

export enum SortMarketsBy {
  MarketCap = "market_cap",
  BumpOrder = "bump",
  DailyVolume = "daily_vol",
  AllTimeVolume = "all_time_vol",
  Price = "price",
  Apr = "apr",
  Tvl = "tvl",
}

export type MarketStateQueryArgs = {
  sortBy?: SortMarketsBy;
  page?: number;
  pageSize?: number;
  orderBy?: OrderBy;
  searchEmojis?: string[];
  inBondingCurve?: boolean;
};

export type PeriodicStateEventQueryArgs = {
  marketID: AnyNumberString;
  start: Date;
  offset: number;
  period: Period;
  limit?: number;
} & Omit<MarketStateQueryArgs, "page" | "pageSize" | "searchEmojis" | "sortBy" | "orderBy">;
