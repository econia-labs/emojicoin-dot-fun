import "server-only";

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { type DefaultQueryArgs, type SearchEmojisQueryArgs } from "../../types/common";
import { type DatabaseTables, TableName } from "../../types/snake-case-types";
import { postgrest } from "../client";
import { withQueryConfig } from "../utils";
import { TableConverter } from "../../types";

/**
 * Curries the `select` and `order` functions for a given table, ensuring the column that the query
 * orders by is a valid column in the table.
 *
 * It handles pagination by taking a `page` and `limit` argument, with a default of the environment
 * variable `LIMIT` value.
 *
 * Note that the range is calculated by the 1-indexed page number and the limit, and the limit is
 * applied to the query.
 *
 * @param table The table to query
 * @returns A function that takes a column name and returns a function that takes query arguments
 * @example
 * ```ts
 *
 * ```
 */
const curriedOrderBy =
  <T extends TableName>(table: T) =>
  <F extends keyof DatabaseTables[T] & string>(column: F) =>
  ({ page, limit = LIMIT, orderBy = ORDER_BY.DESC }: DefaultQueryArgs) =>
    postgrest
      .from(table)
      .select("*")
      .order(column, orderBy)
      .range((page - 1) * limit, page * limit - 1)
      .limit(limit);

const fetchMarketStateBy = <F extends keyof DatabaseTables[TableName.MarketState]>(column: F) => {
  const query = curriedOrderBy(TableName.MarketState)(column);
  const withConfig = withQueryConfig(query, TableConverter[TableName.MarketState]);
  return withConfig;
};

const fetchMarketsByBumpTime = fetchMarketStateBy("bump_time");
const fetchMarketsByMarketCap = fetchMarketStateBy("instantaneous_stats_market_cap");
const fetchMarketsByAllTimeVolume = fetchMarketStateBy("cumulative_stats_quote_volume");
const fetchMarketsByDailyVolume = fetchMarketStateBy("daily_volume");

const selectMarketsBySearchEmojis = ({
  page,
  limit = LIMIT,
  searchEmojis,
}: SearchEmojisQueryArgs) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .contains("symbol_emojis", searchEmojis)
    .range((page - 1) * limit, page * limit - 1)
    .limit(limit);

const fetchMarketsBySearchEmoji = withQueryConfig(
  selectMarketsBySearchEmojis,
  TableConverter[TableName.MarketState]
);

export {
  fetchMarketsByBumpTime,
  fetchMarketsByMarketCap,
  fetchMarketsByAllTimeVolume,
  fetchMarketsByDailyVolume,
  fetchMarketsBySearchEmoji,
};
