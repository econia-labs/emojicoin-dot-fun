import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";
import { stringifyParsedBigInts } from "../json-bigint";
import { type TableName } from "../types/snake-case-types";
import { EMOJICOIN_INDEXER_URL } from "../../server-env";

/**
 * Fetch with BigInt support. This is necessary because the JSON returned by the indexer
 * contains BigInts, which are not supported by the default fetch implementation.
 *
 * If you set the environment variable `FETCH_DEBUG=true`, it will log every response and URL to the
 * console.
 */
const fetchPatch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return response;
  }

  const text = await response.text();
  const json = stringifyParsedBigInts(text);

  if (process.env.FETCH_DEBUG === "true") {
    /* eslint-disable-next-line no-console */
    console.dir(
      {
        RESPONSE: json,
        URL: response.url,
      },
      { depth: null }
    );
  }

  return new Response(json, response);
};

// Custom client that enforces a proper table name when calling `from`.
class CustomClient extends PostgrestClient {
  from = (table: TableName) => super.from(table);
}

export const postgrest = new CustomClient(EMOJICOIN_INDEXER_URL, {
  fetch: fetchPatch,
});

/**
 * Converts an input array of any type to a proper query param for the `postgrest` client.
 *
 * @param s an array of values
 * @returns the properly formatted string input for the query input param
 * @example
 * ```typescript
 * const myArray = ["1", "2", "3"];
 * const res = toQueryArray(myArray);
 * // res === "{1,2,3}"
 * ```
 */
export const toQueryArray = <T>(s: T[]) => `{${s.join(",")}}`;
