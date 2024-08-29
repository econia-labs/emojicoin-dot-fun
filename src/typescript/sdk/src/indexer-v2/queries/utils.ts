import "server-only";

import { type PostgrestSingleResponse, type PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { type Account, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { type AnyNumberString } from "../../types/types";
import { TableName } from "../types/snake-case-types";
import { type Flatten } from "../../types";
import { toAddress } from "../../utils";
import { postgrest } from "./client";

type EnumLiteralType<T extends TableName> = T extends TableName ? `${T}` : never;

type QueryFunction<
  Row extends Record<string, unknown>,
  Result,
  RelationName,
  Relationships extends EnumLiteralType<TableName>,
  QueryArgs extends Record<string, any> | undefined,
> = (args: QueryArgs) => PostgrestFilterBuilder<any, Row, Result, RelationName, Relationships>;

interface PaginationArgs {
  limit?: number;
  offset?: number;
}

type WithConfig<T> = T & Flatten<PaginationArgs & { minimumVersion?: AnyNumberString }>;

// This is primarily used for testing purposes, otherwise this interval might be too short.
const POLLING_INTERVAL = 100;
const POLLING_TIMEOUT = 5000;

const extractRow = <T>(res: PostgrestSingleResponse<T>) => res.data;
const extractRows = <T>(res: PostgrestSingleResponse<Array<T>>) => res.data ?? ([] as T[]);

const getLatestProcessedVersion = async () =>
  postgrest
    .from(TableName.ProcessorStatus)
    .select("last_success_version")
    .maybeSingle()
    .then((r) => {
      const rowWithVersion = extractRow(r);
      if (!rowWithVersion) {
        throw new Error("No processor status row found.");
      }
      return BigInt(rowWithVersion.last_success_version);
    });

/**
 * Wait for the processed version of a table or view to be at least the given version.
 */
const waitForProcessedVersion = async (minimumVersion: AnyNumberString) =>
  new Promise<void>((resolve, reject) => {
    let i = 0;
    const maxTries = Math.floor(POLLING_TIMEOUT / POLLING_INTERVAL);

    const check = async () => {
      try {
        const latestVersion = await getLatestProcessedVersion();
        if (latestVersion >= BigInt(minimumVersion)) {
          resolve();
        } else if (i > maxTries) {
          reject(new Error("Timeout waiting for processed version."));
        } else {
          setTimeout(check, POLLING_INTERVAL);
        }
        i += 1;
      } catch (e) {
        reject(e);
      }
    };

    check();
  });

/**
 *
 * @param queryFn Takes in a query function and returns a curried version of it that accepts
 * pagination arguments and returns the extracted data
 * @param convert A function that converts the raw row data into the desired output, usually
 * by converting it into a camelCased representation of the database row.
 * @returns queryFn(args: QueryArgs & PaginationArgs) => Promise<OutputType[]>
 * where OutputType is the result of convert<Row>(row: Row).
 */
export function withQueryConfig<
  Row extends Record<string, unknown>,
  Result extends Row[],
  RelationName,
  Relationships extends TableName,
  QueryArgs extends Record<string, any> | undefined,
  OutputType,
>(
  queryFn: QueryFunction<Row, Result, RelationName, EnumLiteralType<Relationships>, QueryArgs>,
  convert: (rows: Row) => OutputType
): (args: WithConfig<QueryArgs>) => Promise<OutputType[]> {
  const paginatedQuery = async (args: WithConfig<QueryArgs>) => {
    const { limit, offset, minimumVersion, ...queryArgs } = args;
    let query = queryFn(queryArgs as QueryArgs);

    if (typeof limit === "number") {
      query = query.limit(limit);
    }

    if (typeof offset === "number" && typeof limit === "number") {
      query = query.range(offset, offset + limit - 1);
    }

    if (minimumVersion) {
      await waitForProcessedVersion(minimumVersion);
    }

    const res = await query;
    const rows = extractRows<Row>(res);
    return rows.map((row) => convert(row));
  };

  return paginatedQuery;
}

/**
 * Normalizes an address for use in a query.
 *
 * Currently, it removes all leading zeroes from the address.
 *
 * @param address either the account object, an account address, or a string.
 * @returns the address without any leading zeroes, still prefixed with "0x".
 *
 */
export const normalizeAddressForQuery = <T extends Account>(address: T | AccountAddressInput) =>
  // prettier-ignore
  toAddress(address)
    .toString();
// .replace(/^0x0+/, "0x");
