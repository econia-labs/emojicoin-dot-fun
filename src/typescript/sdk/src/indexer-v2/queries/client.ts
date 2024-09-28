import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";
import { stringifyParsedBigInts } from "../json-bigint";
import { type TableName } from "../types/json-types";
import { EMOJICOIN_INDEXER_URL, FETCH_DEBUG, FETCH_DEBUG_VERBOSE } from "../../server-env";

/**
 * Fetch with BigInt support. This is necessary because the JSON returned by the indexer
 * contains BigInts, which are not supported by the default fetch implementation.
 *
 * To log all query URLs to the terminal, set the environment variable `FETCH_DEBUG=true`.
 * Set `FETCH_DEBUG_VERBOSE=true` to see all query URLs *and* responses.
 * Queries for the the latest success version from the `processor_status` table are not logged.
 */
const fetchPatch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return response;
  }

  const text = await response.text();
  const json = stringifyParsedBigInts(text);

  if (FETCH_DEBUG || FETCH_DEBUG_VERBOSE) {
    const isWaitForEmojicoinIndexerQuery = response.url.endsWith(
      "processor_status?select=last_success_version"
    );
    if (!isWaitForEmojicoinIndexerQuery) {
      console.debug(response.url);
      if (FETCH_DEBUG_VERBOSE) {
        const stringified = JSON.stringify(json, null, 2);
        console.debug(stringified);
      }
    }
  }

  return new Response(json, response);
};

/**
 * Converts an input array of any type to a proper query param for the `postgrest` client.
 *
 * @params an array of values
 * @returns the properly formatted string input for the query input param
 * @example
 * ```typescript
 * const myArray = ["1", "2", "3"];
 * const res = toQueryArray(myArray);
 * // res === "{1,2,3}"
 * ```
 */
export const toQueryArray = <T>(s: T[]) => `{${s.join(",")}}`;

// Custom client that enforces a proper table name when calling `from`.
class CustomClient extends PostgrestClient {
  from = (table: TableName) => super.from(table);
}

const localIndexer =
  EMOJICOIN_INDEXER_URL.includes("localhost") ||
  EMOJICOIN_INDEXER_URL.includes("host.docker.internal");

const authHeaders =
  !localIndexer && process.env.EMOJICOIN_INDEXER_API_KEY
    ? { "x-api-key": `${process.env.EMOJICOIN_INDEXER_API_KEY}` }
    : undefined;

export const postgrest = new CustomClient(EMOJICOIN_INDEXER_URL, {
  fetch: fetchPatch,
  headers: authHeaders,
});
