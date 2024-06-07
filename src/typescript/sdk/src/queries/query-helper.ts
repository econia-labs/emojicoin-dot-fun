import "server-only";

import { type PostgrestError, type PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { LIMIT, type INBOX_EVENTS_TABLE } from "./const";

/* eslint-disable-next-line import/no-unused-modules */
export type QueryResponse<T> = {
  data: T[];
  errors: (PostgrestError | null)[];
};

/**
 * For use after converting the response from an aggregated query response.
 */
export type EventsAndErrors<T> = {
  events: Array<T>;
  errors: Array<PostgrestError | null>;
};

export type AggregateQueryResultsArgs = {
  query: PostgrestFilterBuilder<any, any, any, typeof INBOX_EVENTS_TABLE, unknown>;
  maxNumQueries?: number;
  maxTotalRows?: number;
};

type JSONResponseType<T> = {
  data: T;
  transaction_version: number;
};

type CustomQueryResponseType<T> = T & { transaction_version: number };

type InnerResponseType<T> = Array<JSONResponseType<T> | CustomQueryResponseType<T>>;

const hasJSONData = <T>(
  data: JSONResponseType<T> | CustomQueryResponseType<T>
): data is JSONResponseType<T> => "data" in data;

/**
 * Since most `getAll` queries are similar, we can abstract the shared logic into a helper function.
 * This function will aggregate all events of a given type from the inbox.
 *
 * **NOTE**: This function will auto-paginate and override any `.range(...)` filter in `query`.
 *
 * **NOTE**: This will query infinitely unless you specify `maxNumQueries`.
 *
 * @param args
 *  @type `T`: The type of data returned from the query in `data: Array<T>`
 *  @field `query`: postgrest query with filters {@link PostgrestFilterBuilder}
 *  @field `maxNumQueries`: Optional maximum number of queries to make, defaults to {@link Infinity}
 *
 * @returns a query response {@link QueryResponse} where `T` is the data type you're expecting.
 *
 */
export const aggregateQueryResults = async <T>(
  args: AggregateQueryResultsArgs
): Promise<QueryResponse<T & { version: number }>> => {
  const { query, maxNumQueries = Infinity, maxTotalRows = Infinity } = args;
  const aggregated: (T & { version: number })[] = [];
  const errors: (PostgrestError | null)[] = [];

  let i = 0;
  let shouldContinue = true;

  while (shouldContinue && i < maxNumQueries && aggregated.length < maxTotalRows) {
    const offset = aggregated.length;
    /* eslint-disable-next-line no-await-in-loop */
    const { events, error } = await query.range(offset, offset + LIMIT - 1).then((res) => ({
      events: (res.data ?? []) as InnerResponseType<T>,
      error: res.error,
    }));

    // TODO: Clean this up later. JSON queries have two nested data fields, while custom
    // queries/views only have one (because of the postgrest API response).
    aggregated.push(
      ...events.map((e) => ({ ...(hasJSONData(e) ? e.data : e), version: e.transaction_version }))
    );
    shouldContinue = events.length === LIMIT;
    errors.push(error);
    i += 1;
  }

  return {
    data: aggregated,
    errors,
  };
};
