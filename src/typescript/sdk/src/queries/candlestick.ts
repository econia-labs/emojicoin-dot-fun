"use server";

import { type CandlestickResolution } from "../const";
import { INBOX_EVENTS_TABLE, LIMIT, ORDER_BY } from "./const";
import { wrap } from "./utils";
import { type JSONTypes } from "../types";
import { type AggregateQueryResultsArgs, aggregateQueryResults } from "./query-helper";
import { postgrest } from "./inbox-url";

export type CandlestickQueryArgs = {
  marketID: bigint | number | string;
  resolution?: CandlestickResolution;
};

export const paginateCandlesticks = async (
  args: CandlestickQueryArgs & Omit<AggregateQueryResultsArgs, "query">
) => {
  const { marketID, resolution } = args;
  let query = postgrest
    .from(INBOX_EVENTS_TABLE)
    .select("*")
    .filter("event_name", "eq", "emojicoin_dot_fun::PeriodicState")
    .eq("data->market_metadata->market_id", wrap(marketID))
    .limit(Math.min(LIMIT, args.maxTotalRows ?? Infinity))
    .order("transaction_version", ORDER_BY.DESC);
  query = resolution ? query.eq("data->periodic_state_metadata->period", wrap(resolution)) : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
    ...args,
  });

  if (errors.some((e) => e)) {
    /* eslint-disable-next-line no-console */
    console.warn("Error fetching chat events", errors);
  }

  return data;
};
