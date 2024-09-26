import { type Period } from "../../const";
import { type OrderBy } from "../../queries/const";

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
  limit?: number;
  orderBy?: OrderBy;
  searchEmojis?: string[];
  inBondingCurve?: boolean;
};

export type PeriodicStateEventQueryArgs = {
  offset: number;
  period: Period;
} & Omit<MarketStateQueryArgs, "page" | "searchEmojis" | "sortBy" | "orderBy">;
