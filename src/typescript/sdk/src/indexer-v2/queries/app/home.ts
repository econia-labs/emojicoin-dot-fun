import "server-only";

import { LIMIT, ORDER_BY, toOrderBy } from "../../const";
import { DatabaseTypeConverter } from "../../types";
import {
  DEFAULT_SORT_BY,
  type MarketStateQueryArgs,
  type PriceFeedQueryArgs,
} from "../../types/common";
import { type DatabaseJsonType, TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { joinEqClauses } from "../misc";
import { sortByWithFallback } from "../query-params";
import { queryHelper, queryHelperWithCount } from "../utils";

// A helper function to abstract the logic for fetching rows that contain market state.
const selectMarketHelper = <T extends TableName.MarketState | TableName.PriceFeed>({
  tableName,
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  selectEmojis,
  sortBy = DEFAULT_SORT_BY,
  inBondingCurve,
  count,
  /* eslint-disable @typescript-eslint/no-explicit-any */
}: MarketStateQueryArgs & { tableName: T }) => {
  let query = postgrest.from(tableName).select("*", count ? { count: "exact" } : undefined);

  query = query
    .order(sortByWithFallback(sortBy), orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (searchEmojis?.length) {
    query = query.contains("symbol_emojis", toQueryArray(searchEmojis));
  }

  if (selectEmojis?.length) {
    query = query.or(joinEqClauses(selectEmojis));
  }

  if (typeof inBondingCurve === "boolean") {
    query = query.eq("in_bonding_curve", inBondingCurve);
  }

  return query.overrideTypes<DatabaseJsonType["market_state"][], { merge: false }>();
};

const selectMarketStates = (args: MarketStateQueryArgs) =>
  selectMarketHelper({ ...args, tableName: TableName.MarketState });

const selectMarketsFromPriceFeed = ({
  page = 1,
  pageSize,
  orderBy,
  sortBy,
}: PriceFeedQueryArgs) => {
  return postgrest
    .from(TableName.PriceFeed)
    .select("*")
    .order(sortBy === "delta" ? "delta_percentage" : sortByWithFallback(sortBy), orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);
};

const selectMarketsFromPriceFeedWithNulls = ({
  page = 1,
  pageSize,
  orderBy,
  sortBy,
}: PriceFeedQueryArgs) => {
  return postgrest
    .from(TableName.PriceFeedWithNulls)
    .select("*")
    .order(sortBy === "delta" ? "delta_percentage" : sortByWithFallback(sortBy), orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);
};

export const fetchMarkets = queryHelper(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

export const fetchMarketsJson = queryHelper(selectMarketStates);

export const fetchMarketsWithCount = queryHelperWithCount(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

/**
 * A manual query to get the largest market ID and thus the total number of markets registered
 * on-chain, according to the indexer thus far.
 *
 * This is necessary to use because for some reason, { count: "exact", head: "true" } in the
 * postgrest-js API doesn't work when there are no rows returned and it's only counting the total
 * number of rows.
 *
 * This is used instead of the market registration events table because `market_latest_state_event`
 * has an index on `market_id`.
 *
 * @returns the largest market ID, aka the total number of markets registered
 */
export const fetchLargestMarketID = async () => {
  return await postgrest
    .from(TableName.MarketLatestStateEvent)
    .select("market_id")
    .order("market_id", toOrderBy("desc"))
    .limit(1)
    .single()
    .then((r) => Number(r.data?.market_id) ?? 0);
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

/**
 * Same query as above, except returns null values for price delta related columns for markets
 * with no volume in the last 24 hours.
 */
export const fetchPriceFeedWithMarketStateAndNulls = queryHelper(
  selectMarketsFromPriceFeedWithNulls,
  (v): DatabaseJsonType["price_feed_with_nulls"] => v
);
