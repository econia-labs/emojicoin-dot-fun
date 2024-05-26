import { type PostgrestError, type PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { LIMIT, type TABLE_NAME } from "./const";

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
  query: PostgrestFilterBuilder<any, any, any, typeof TABLE_NAME, unknown>;
  maxNumQueries?: number;
  inboxUrl?: string;
};

type InnerResponseType<T> = Array<{
  data: T;
}>;

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
  args: Omit<AggregateQueryResultsArgs, "inboxUrl">
): Promise<QueryResponse<T>> => {
  const { query, maxNumQueries = Infinity } = args;
  const aggregated: T[] = [];
  const errors: (PostgrestError | null)[] = [];

  let i = 0;
  let shouldContinue = true;

  while (shouldContinue && i < maxNumQueries) {
    const offset = aggregated.length;
    /* eslint-disable-next-line no-await-in-loop */
    const { events, error } = await query.range(offset, offset + LIMIT - 1).then((res) => ({
      events: (res.data ?? []) as InnerResponseType<T>,
      error: res.error,
    }));

    aggregated.push(...events.map((e) => e.data));
    shouldContinue = events.length === LIMIT;
    errors.push(error);
    i += 1;
  }

  return {
    data: aggregated as T[],
    errors,
  };
};
