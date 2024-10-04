import { SortMarketsBy } from "../types/common";
import { type DatabaseJsonType } from "../types/json-types";

/* eslint-disable-next-line import/no-unused-modules */
export const sortByToColumn = (sortBy: SortMarketsBy): keyof DatabaseJsonType["market_state"] => {
  switch (sortBy) {
    case SortMarketsBy.AllTimeVolume:
      return "cumulative_stats_quote_volume";
    case SortMarketsBy.BumpOrder:
      return "bump_time";
    case SortMarketsBy.MarketCap:
      return "instantaneous_stats_market_cap";
    case SortMarketsBy.DailyVolume:
      return "daily_volume";
    case SortMarketsBy.Price:
      return "last_swap_avg_execution_price_q64";
    case SortMarketsBy.Apr:
      return "daily_tvl_per_lp_coin_growth";
    case SortMarketsBy.Tvl:
      return "instantaneous_stats_total_value_locked";
    default:
      throw new Error(`Got invalid "sortBy" argument: ${sortBy}`);
  }
};

export const sortByWithFallback = (
  input?: string | null
): keyof DatabaseJsonType["market_state"] => {
  const sortBy = input ?? SortMarketsBy.MarketCap;
  try {
    return sortByToColumn(sortBy as SortMarketsBy);
  } catch (e) {
    return sortByToColumn(SortMarketsBy.MarketCap);
  }
};

const validSortBy: Set<SortMarketsBy> = new Set(Object.values(SortMarketsBy));

const isValidSortBy = (input?: string | null): input is SortMarketsBy =>
  validSortBy.has((input ?? "") as unknown as SortMarketsBy);

/* eslint-disable-next-line import/no-unused-modules */
export const getValidSortByForPoolsPage = (input?: string | null): SortMarketsBy => {
  if (isValidSortBy(input)) {
    return input;
  }
  return SortMarketsBy.MarketCap;
};
