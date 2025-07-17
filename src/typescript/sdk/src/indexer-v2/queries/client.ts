import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";

import { EMOJICOIN_INDEXER_URL, FETCH_DEBUG, FETCH_DEBUG_VERBOSE } from "../../server/env";
import { parsePostgrestJSON, stringifyJSONWithBigInts } from "../json-bigint";
import type { DatabaseRpc, TableName } from "../types/json-types";

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
  if (!contentType?.match(/^application\/.*json;/)) {
    return response;
  }

  const text = await response.text();
  const json = parsePostgrestJSON(text);
  const stringified = stringifyJSONWithBigInts(json);

  if (FETCH_DEBUG || FETCH_DEBUG_VERBOSE) {
    const isWaitForEmojicoinIndexerQuery = response.url.endsWith(
      "processor_status?select=last_success_version"
    );
    if (!isWaitForEmojicoinIndexerQuery) {
      console.debug(response.url);
      if (FETCH_DEBUG_VERBOSE) {
        /* eslint-disable-next-line no-console */
        console.dir(json, { depth: null });
      }
    }
  }

  if (response.status === 404) {
    console.warn("Got a 404 response.");
    console.warn({
      url: response.url,
      data: stringified,
    });
  }

  return new Response(stringified, response);
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

// Custom client that enforces proper table names and RPC function names.
class CustomClient extends PostgrestClient {
  override from<T extends TableName>(relation: T) {
    return super.from(relation);
  }

  /**
   * @deprecated Use `dbRpc` instead to enforce allowed Database RPC function calls.
   */
  rpc = super.rpc as never;

  /**
   * Overrides the `rpc` function call to ensure that the `DatabaseRPC` function name exists in
   * the TypeScript types.
   *
   * Also defaults to using a `get` request instead of a `post` request if no parameter is passed
   * in specifying `options.get`.
   */
  dbRpc<T extends DatabaseRpc>(
    fn: T,
    args?: Record<string, unknown>,
    options?: {
      head?: boolean;
      get?: boolean;
      count?: "exact" | "planned" | "estimated";
    }
  ) {
    // Default to using `get`, not `post`.
    const get = options?.get ?? true;
    return super.rpc(fn, args, { ...options, get });
  }
}

const localIndexer =
  EMOJICOIN_INDEXER_URL.includes("localhost") ||
  EMOJICOIN_INDEXER_URL.includes("host.docker.internal");

const authHeaders: Record<string, string> =
  !localIndexer && process.env.EMOJICOIN_INDEXER_API_KEY
    ? { "x-api-key": `${process.env.EMOJICOIN_INDEXER_API_KEY}`, Accept: "application/json" }
    : { Accept: "application/json" };

export const postgrest = new CustomClient(EMOJICOIN_INDEXER_URL, {
  fetch: fetchPatch,
  headers: authHeaders,
});
