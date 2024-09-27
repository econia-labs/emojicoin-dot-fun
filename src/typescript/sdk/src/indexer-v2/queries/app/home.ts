import "server-only";

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { SortMarketsBy, type MarketStateQueryArgs } from "../../types/common";
import { TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { getLatestProcessedVersionByTable, queryHelper } from "../utils";
import { DatabaseTypeConverter } from "../../types";
import { RegistryView } from "../../../emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils/aptos-client";
import { toRegistryView } from "../../../types";
import { sortByWithFallback } from "../query-params";

const selectMarketStates = ({
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  sortBy = SortMarketsBy.MarketCap,
  inBondingCurve,
}: MarketStateQueryArgs) => {
  let query = postgrest
    .from(TableName.MarketState)
    .select("*")
    .order(sortByWithFallback(sortBy), orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (searchEmojis && searchEmojis.length) {
    query = query.contains("symbol_emojis", toQueryArray(searchEmojis));
  }

  if (typeof inBondingCurve === "boolean") {
    query = query.eq("in_bonding_curve", inBondingCurve);
  }

  return query;
};

export const fetchMarkets = queryHelper(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

// The featured market is simply the current highest daily volume market.
export const fetchFeaturedMarket = async () =>
  fetchMarkets({ page: 1, pageSize: 1, sortBy: SortMarketsBy.DailyVolume }).then((markets) =>
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
