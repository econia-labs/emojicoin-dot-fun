import { PostgrestClient } from "@supabase/postgrest-js";
import JSON_BIGINT from "../json-bigint";
import { type TableName } from "../types/snake-case-types";

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
  const parsedWithBigInts = JSON_BIGINT.parse(text);
  const json = JSON.stringify(parsedWithBigInts, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

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

export const postgrest = new CustomClient(process.env.INDEXER_URL!, { fetch: fetchPatch });
