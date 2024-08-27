import "server-only";

import { type PostgrestSingleResponse, type PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { postgrest } from "./base";
import { ORDER_BY } from "../../queries/const";
import { type AnyNumberString } from "../../types/types";
import { type TableName } from "../types/snake-case-types";
import { type Flatten } from "../../types";

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

const getLatestProcessedVersion = async (tableOrView: TableName) =>
  postgrest
    .from(tableOrView)
    .select("transaction_version")
    .order("transaction_version", ORDER_BY.DESC)
    .limit(1)
    .maybeSingle()
    .then((r) => {
      const rowWithVersion = extractRow(r);
      if (rowWithVersion === null) {
        // We don't throw an error here because it's possible that the table is empty.
        return 0n;
      }
      return BigInt(rowWithVersion.transaction_version);
    });

/**
 * Wait for the processed version of a table or view to be at least the given version.
 */
const waitForProcessedVersion = async (args: {
  minimumVersion: AnyNumberString;
  tableName: TableName;
}) =>
  new Promise<void>((resolve, reject) => {
    const minimumVersion = BigInt(args.minimumVersion);
    const { tableName } = args;
    let i = 0;
    const maxTries = Math.floor(POLLING_TIMEOUT / POLLING_INTERVAL);

    const check = async () => {
      try {
        const latestVersion = await getLatestProcessedVersion(tableName);
        if (latestVersion >= minimumVersion) {
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
  convert: (rows: Row) => OutputType,
  tableName: Relationships
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
      await waitForProcessedVersion({
        minimumVersion,
        tableName,
      });
    }

    const res = await query;
    const rows = extractRows<Row>(res);
    return rows.map((row) => convert(row));
  };

  return paginatedQuery;
}
