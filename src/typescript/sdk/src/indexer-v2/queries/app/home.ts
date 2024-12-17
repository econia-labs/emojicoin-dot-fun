if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { DEFAULT_SORT_BY, type MarketStateQueryArgs } from "../../types/common";
import { type DatabaseJsonType, TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { getLatestProcessedEmojicoinVersion, queryHelper, queryHelperWithCount } from "../utils";
import { DatabaseTypeConverter } from "../../types";
import { RegistryView } from "@/contract-apis/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils/aptos-client";
import { toRegistryView } from "../../../types";
import { sortByWithFallback } from "../query-params";
import { type PostgrestFilterBuilder } from "@supabase/postgrest-js";

// A helper function to abstract the logic for fetching rows that contain market state.
const selectMarketHelper = <T extends TableName.MarketState | TableName.PriceFeed>({
  tableName,
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  sortBy = DEFAULT_SORT_BY,
  inBondingCurve,
  count,
  /* eslint-disable @typescript-eslint/no-explicit-any */
}: MarketStateQueryArgs & { tableName: T }): PostgrestFilterBuilder<
  any,
  any,
  any[],
  TableName,
  T
> => {
  let query: any = postgrest.from(tableName);
  /* eslint-enable @typescript-eslint/no-explicit-any */

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

const selectMarketStates = (args: MarketStateQueryArgs) =>
  selectMarketHelper({ ...args, tableName: TableName.MarketState });

const selectMarketsFromPriceFeed = ({ ...args }: MarketStateQueryArgs) =>
  selectMarketHelper({
    ...args,
    tableName: TableName.PriceFeed,
  });

export const fetchMarkets = queryHelper(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

export const fetchMarketsWithCount = queryHelperWithCount(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

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

// Note the no-op conversion function- this is simply to satisfy the `queryHelper` params and
// indicate with generics that we don't convert the type here.
// We don't do it because of the issues with serialization/deserialization in `unstable_cache`.
// It's easier to use the conversion function later (after the response is returned from
// `unstable_cache`) rather than deal with the headache of doing it before.
// Otherwise things like `Date` objects aren't properly created upon retrieval from the
// `unstable_cache` query.
export const fetchPriceFeedWithMarketState = queryHelper(
  selectMarketsFromPriceFeed,
  (v): DatabaseJsonType["price_feed"] => v
);
