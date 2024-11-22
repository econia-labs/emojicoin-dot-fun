if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { SortMarketsBy, type MarketStateQueryArgs } from "../../types/common";
import { DatabaseRpc, TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { getLatestProcessedEmojicoinVersion, queryHelper, queryHelperWithCount } from "../utils";
import { DatabaseTypeConverter } from "../../types";
import { RegistryView } from "../../../emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils/aptos-client";
import { toRegistryView } from "../../../types";
import { sortByWithFallback } from "../query-params";
import { type PostgrestFilterBuilder } from "@supabase/postgrest-js";

const selectMarketStates = ({
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  sortBy = SortMarketsBy.MarketCap,
  inBondingCurve,
  count,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
}: MarketStateQueryArgs): PostgrestFilterBuilder<any, any, any[], TableName, unknown> => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let query: any = postgrest.from(TableName.MarketState);

  if (count === true) {
    query = query.select("*", { count: "exact" });
  } else {
    query = query.select("*");
  }

  query = query
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

export const fetchMarketsWithCount = queryHelperWithCount(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

export const DEFAULT_FEATURED_BY = SortMarketsBy.BumpOrder;
export const DEFAULT_ORDERED_BY_FOR_FEATURED_BY = ORDER_BY.DESC;

export const fetchFeaturedMarket = async () =>
  fetchMarkets({
    page: 1,
    pageSize: 1,
    sortBy: DEFAULT_FEATURED_BY,
    orderBy: ORDER_BY.DESC,
  }).then((markets) => (markets ?? []).at(0));

/**
 * Retrieves the number of markets by querying the view function in the registry contract on-chain.
 * The ledger (transaction) version is specified in order to reflect the exact total number of
 * unique markets the `emojicoin-dot-fun` processor will have processed up to that version.
 *
 * @returns The number of registered markets at the latest processed transaction version
 */
export const fetchNumRegisteredMarkets = async () => {
  const aptos = getAptosClient();
  let latestVersion: bigint;
  try {
    latestVersion = await getLatestProcessedEmojicoinVersion();
  } catch (e) {
    console.error("Couldn't get the latest processed version.", e);
    throw e;
  }
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
    return postgrest
      .from(TableName.MarketState)
      .select("", { count: "exact", head: true })
      .then((r) => r.count ?? 0);
  }
};

const selectPriceFeed = () => postgrest.rpc(DatabaseRpc.PriceFeed, undefined, { get: true });

export const fetchPriceFeed = queryHelper(
  selectPriceFeed,
  DatabaseTypeConverter[DatabaseRpc.PriceFeed]
);
