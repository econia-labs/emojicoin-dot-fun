import "server-only";

import { type Types } from "../types";
import { paginateMarketRegistrations } from "./market";

/**
 * Helper function to prepare `column` values in `postgrest` query filters for jsonb data.
 *
 * The filter field in `postgrest` queries requires all values to be wrapped in double quotes when
 * filtering by inner jsonb columns.
 *
 * @param val
 * @returns string
 *
 * @example
 * s(1) === "\"1\""
 * s(BigInt(1)) === "\"1\""
 * s("1") === "\"1\""
 * s("hello") === "\"hello\""
 *
 * await postgrest
 *   .from("table")
 *   .select()
 *   .eq("column", s(1))
 *
 */
export const wrap = (val: number | bigint | string): string => {
  return `"${val.toString()}"`;
};

export const getMostRecentMarketEvent = async (): Promise<Types.MarketRegistrationEvent | null> => {
  const { markets } = await paginateMarketRegistrations();
  return markets.length > 0 ? markets[0] : null;
};
