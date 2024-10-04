/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import {
  type PostgrestSingleResponse,
  type PostgrestFilterBuilder,
  type PostgrestBuilder,
  type PostgrestTransformBuilder,
} from "@supabase/postgrest-js";
import { type Account, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { type AnyNumberString } from "../../types/types";
import { type DatabaseJsonType, TableName } from "../types/json-types";
import { toAccountAddress } from "../../utils";
import { postgrest } from "./client";
import { type DatabaseModels } from "../types";

type EnumLiteralType<T extends TableName> = T extends TableName ? `${T}` : never;

type QueryFunction<
  Row extends Record<string, unknown>,
  Result,
  RelationName,
  Relationships extends EnumLiteralType<TableName>,
  QueryArgs extends Record<string, any> | undefined,
> = (
  args: QueryArgs
) =>
  | PostgrestFilterBuilder<any, Row, Result, RelationName, Relationships>
  | PostgrestTransformBuilder<any, Row, Result, RelationName, Relationships>;

type WithConfig<T> = T & { minimumVersion?: AnyNumberString };

// This is primarily used for testing purposes, otherwise this interval might be too short.
const POLLING_INTERVAL = 500;
const POLLING_TIMEOUT = 5000;

const extractRow = <T>(res: PostgrestSingleResponse<T>) => res.data;
const extractRows = <T>(res: PostgrestSingleResponse<Array<T>>) => res.data ?? ([] as T[]);

// NOTE: If we ever add another processor type to the indexer processor stack, this will need to be
// updated, because it is assumed here that there is a single row returned. Multiple processors
// would mean there would be multiple rows.
export const getLatestProcessedEmojicoinVersion = async () =>
  postgrest
    .from(TableName.ProcessorStatus)
    .select("last_success_version")
    .limit(1)
    .single()
    .then((r) => {
      const rowWithVersion = extractRow(r);
      if (!rowWithVersion) {
        console.error(r);
        throw new Error("No processor status row found.");
      }
      if (!("last_success_version" in rowWithVersion)) {
        console.warn("Couldn't find `last_success_version` in the response data.", r);
      }
      return BigInt(rowWithVersion.last_success_version);
    });
/**
 * Wait for the processed version of a table or view to be at least the given version.
 */
export const waitForEmojicoinIndexer = async (
  minimumVersion: AnyNumberString,
  maxWaitTimeMs?: number
) =>
  new Promise<void>((resolve, reject) => {
    let i = 0;
    const maxTries = Math.floor((maxWaitTimeMs ?? POLLING_TIMEOUT) / POLLING_INTERVAL);

    const check = async () => {
      try {
        const latestVersion = await getLatestProcessedEmojicoinVersion();
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
 * @param queryFn Takes in a query function that's used to be called after waiting for the indexer
 * to reach a certain version. Then it extracts the row data and returns it.
 * @param convert A function that converts the raw row data into the desired output, usually
 * by converting it into a camelCased representation of the database row.
 * @returns A curried function that applies the logic to the new query function.
 */
export function queryHelper<
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
  const query = async (args: WithConfig<QueryArgs>) => {
    const { minimumVersion, ...queryArgs } = args;
    const innerQuery = queryFn(queryArgs as QueryArgs);

    if (minimumVersion) {
      await waitForEmojicoinIndexer(minimumVersion);
    }

    try {
      const res = await innerQuery;
      const rows = extractRows<Row>(res);
      return rows.map(convert);
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return query;
}

export function queryHelperSingle<
  T extends TableName,
  Row extends DatabaseJsonType[T],
  Model extends DatabaseModels[T],
  QueryArgs extends Record<string, any> | undefined,
>(queryFn: (args: QueryArgs) => PostgrestBuilder<Row>, convert: (row: Row) => Model) {
  const query = async (args: WithConfig<QueryArgs>) => {
    const { minimumVersion, ...queryArgs } = args;
    const innerQuery = queryFn(queryArgs as QueryArgs);

    if (minimumVersion) {
      await waitForEmojicoinIndexer(minimumVersion);
    }

    const res = await innerQuery;
    const row = extractRow<Row>(res);
    return row ? convert(row) : null;
  };

  return query;
}

/**
 * Strip leading zeroes from an address.
 *
 * @param address either the account object, an account address, or a string.
 * @returns the address without any leading zeroes, still prefixed with "0x".
 *
 */
/* eslint-disable-next-line import/no-unused-modules */
export const stripLeadingZeroes = <T extends Account>(address: T | AccountAddressInput) =>
  // prettier-ignore
  toAccountAddress(address)
    .toString()
    .replace(/^0x0+/, "0x");
