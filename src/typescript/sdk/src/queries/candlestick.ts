/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { PostgrestClient } from "@supabase/postgrest-js";
import { type CandlestickResolution, INBOX_URL } from "../const";
import { TABLE_NAME, ORDER_BY } from "./const";
import { STRUCT_STRINGS } from "../utils";
import { wrap } from "./utils";
import { type ContractTypes, type JSONTypes, toPeriodicStateEvent } from "../types";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";

export type CandlestickQueryArgs = {
  marketID: bigint | number;
  resolution?: CandlestickResolution;
  inboxUrl?: string;
};

export const paginateCandlesticks = async (
  args: CandlestickQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.PeriodicStateEvent>> => {
  const { marketID, resolution, inboxUrl = INBOX_URL } = args;
  let query = new PostgrestClient(inboxUrl)
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.PeriodicStateEvent)
    .eq("data->market_metadata->market_id", wrap(marketID))
    .order("transaction_version", ORDER_BY.DESC);
  query = resolution ? query.eq("data->periodic_state_metadata->period", wrap(resolution)) : query;

  const res = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
  });

  return {
    events: res.data.map((e) => toPeriodicStateEvent(e)),
    errors: res.errors,
  };
};
