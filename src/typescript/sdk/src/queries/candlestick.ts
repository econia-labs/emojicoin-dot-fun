import "server-only";

import { type CandlestickResolution } from "../const";
import { INBOX_EVENTS_TABLE, ORDER_BY } from "./const";
import { STRUCT_STRINGS } from "../utils";
import { wrap } from "./utils";
import { type Types, type JSONTypes, toPeriodicStateEvent } from "../types";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import { postgrest } from "./inbox-url";

export type CandlestickQueryArgs = {
  marketID: bigint | number;
  resolution?: CandlestickResolution;
};

export const paginateCandlesticks = async (
  args: CandlestickQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<Types.PeriodicStateEvent>> => {
  const { marketID, resolution } = args;
  let query = postgrest
    .from(INBOX_EVENTS_TABLE)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.PeriodicStateEvent)
    .eq("data->market_metadata->market_id", wrap(marketID))
    .order("transaction_version", ORDER_BY.DESC);
  query = resolution ? query.eq("data->periodic_state_metadata->period", wrap(resolution)) : query;

  const res = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
  });

  return {
    events: res.data.map((e) => toPeriodicStateEvent(e, e.version)),
    errors: res.errors,
  };
};
