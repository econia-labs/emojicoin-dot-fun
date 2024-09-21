import "server-only";

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { SortMarketsBy, type DefaultQueryArgs } from "../../types/common";
import { type DatabaseRow, TableName } from "../../types/snake-case-types";
import { postgrest, toQueryArray } from "../client";
import { getLatestProcessedVersionByTable, queryHelper } from "../utils";
import { TableConverter } from "../../types";
import { RegistryView } from "../../../emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils/aptos-client";
import { toRegistryView } from "../../../types";

const sortByToColumnName = (sortBy: SortMarketsBy): keyof DatabaseRow["market_state"] => {
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
      return "daily_tvl_per_lp_coin_growth_q64";
    case SortMarketsBy.Tvl:
      return "instantaneous_stats_total_value_locked";
    default:
      throw new Error(`Got invalid "sortBy" argument: ${sortBy}`);
  }
};

const selectMarketStates = ({
  page = 1,
  limit = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  sortBy = SortMarketsBy.MarketCap,
}: DefaultQueryArgs) => {
  let query = postgrest
    .from(TableName.MarketState)
    .select("*")
    .order(sortByToColumnName(sortBy), orderBy)
    .range((page - 1) * limit, page * limit - 1)
    .limit(limit);

  if (searchEmojis && searchEmojis.length) {
    query = query.contains("symbol_emojis", toQueryArray(searchEmojis));
  }

  return query;
};

export const fetchMarkets = queryHelper(selectMarketStates, TableConverter[TableName.MarketState]);

// The featured market is simply the current highest daily volume market.
export const fetchFeaturedMarket = async () =>
  fetchMarkets({ page: 1, limit: 1, sortBy: SortMarketsBy.DailyVolume }).then((markets) =>
    markets.at(0)
  );

/**
 * Retrieves the number of markets by querying the view function in the registry contract on-chain.
 * The ledger (transaction) version is specified in order to reflect the exact total number of
 * unique markets the `emojicoin-dot-fun` processor will have processed up to that version.
 *
 * @returns The number of registered markets at the latest processed transaction version
 */
export const fetchNumRegisteredMarkets = async () => {
  const { aptos } = getAptosClient();
  const latestVersion = await getLatestProcessedVersionByTable();
  try {
    const numRegisteredMarkets = await RegistryView.view({
      aptos,
      options: {
        ledgerVersion: latestVersion,
      },
    }).then((r) => toRegistryView(r).numMarkets);
    return Number(numRegisteredMarkets);
  } catch (e: unknown) {
    // If the view function fails, our NextJS backend is probably rate-limited by the Aptos rest API
    // and we should just find the count ourselves. Since this is a costly operation, this should
    // primarily be a fallback to avoid defaulting to "0" in the UI. In practice, we should never
    // get rate-limited, since we'll cache the query results and add a proper revalidation time.
    return (
      postgrest
        .from(TableName.MarketState)
        // `count: "exact", head: true` retrieves the count of all rows in the table, but no rows.
        .select("", { count: "exact", head: true })
        .then((r) => r.count ?? 0)
    );
  }
};
