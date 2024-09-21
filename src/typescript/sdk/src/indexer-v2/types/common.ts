import { Period } from "../../const";
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

export type DefaultQueryArgs = {
  sortBy?: SortMarketsBy;
  page?: number;
  limit?: number;
  orderBy?: OrderBy;
  searchEmojis?: string[];
};

export type PeriodicStateEventQueryArgs = {
  offset: number;
  period: Period;
} & Omit<DefaultQueryArgs, "page" | "searchEmojis" | "sortBy" | "orderBy">;
