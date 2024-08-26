import "server-only";

import { type Types, type JSONTypes, toSwapEvent } from "../types";
import { INBOX_EVENTS_TABLE, INBOX_SWAPS, LIMIT, ORDER_BY } from "./const";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import { postgrest } from "./inbox-url";

export const paginateSwapEvents = async (
  args: Omit<AggregateQueryResultsArgs, "query"> & {
    swapper?: string;
    marketID?: number | bigint | string;
  }
) => {
  const { swapper, marketID } = args;

  let query = postgrest
    .from(INBOX_SWAPS)
    .select("*")
    .filter("event_name", "eq", "emojicoin_dot_fun::Swap")
    .order("transaction_version", ORDER_BY.DESC);

  query = marketID ? query.eq("data->>market_id", marketID.toString()) : query;
  query = swapper ? query.eq("data->>swapper", swapper) : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.SwapEvent>({
    ...args,
    query,
  });

  if (errors.some((e) => e)) {
    /* eslint-disable-next-line no-console */
    console.warn("Error fetching chat events", errors);
  }

  return data;
};

// These will always be distinct, so `distinct on` is not necessary.
export const getAllPostBondingCurveMarkets = async (
  args: Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<Types.SwapEvent>> => {
  const res = await aggregateQueryResults<JSONTypes.SwapEvent>({
    ...args,
    query: postgrest
      .from(INBOX_EVENTS_TABLE)
      .select("*")
      .filter("event_name", "eq", "emojicoin_dot_fun::Swap")
      .filter("data->results_in_state_transition", "eq", true)
      .limit(Math.min(LIMIT, args.maxTotalRows ?? Infinity))
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toSwapEvent(e, e.version)),
    errors: res.errors,
  };
};
