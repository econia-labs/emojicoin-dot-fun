import "server-only";

import { type ContractTypes } from "../types";
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
  switch (typeof val) {
    case "number":
      return `"${val.toString()}"`;
    case "bigint":
      return `"${val.toString()}"`;
    case "string":
      return `"${val}"`;
    default:
      throw new Error(`Invalid value: ${val}`);
  }
};

export const getMostRecentMarketEvent =
  async (): Promise<ContractTypes.MarketRegistrationEvent | null> => {
    const { markets } = await paginateMarketRegistrations();
    return markets.length > 0 ? markets[0] : null;
  };
