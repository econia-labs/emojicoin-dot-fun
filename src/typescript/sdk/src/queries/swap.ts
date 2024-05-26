import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL } from "../const";
import { type ContractTypes, type JSONTypes, toSwapEvent } from "../types";
import { STRUCT_STRINGS } from "../utils";
import { TABLE_NAME, ORDER_BY } from "./const";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import { wrap } from "./utils";

export const paginateUserSwapEvents = async (
  args: Omit<AggregateQueryResultsArgs, "query"> & {
    swapper?: string;
    marketID?: number | bigint;
  }
): Promise<EventsAndErrors<ContractTypes.SwapEvent>> => {
  const { inboxUrl = INBOX_URL, swapper, marketID } = args;

  let query = new PostgrestClient(inboxUrl)
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.SwapEvent)
    .order("transaction_version", ORDER_BY.DESC);

  query = marketID ? query.eq("data->market_metadata->market_id", wrap(marketID)) : query;
  query = swapper ? query.eq("data->swapper", wrap(swapper)) : query;

  const res = await aggregateQueryResults<JSONTypes.SwapEvent>({
    ...args,
    query,
  });

  return {
    events: res.data.map((e) => toSwapEvent(e)),
    errors: res.errors,
  };
};

// These will always be distinct, so `distinct on` is not necessary.
export const getAllPostBondingCurveMarkets = async (
  args: Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.SwapEvent>> => {
  const inboxUrl = args?.inboxUrl ?? INBOX_URL;
  const postgrest = new PostgrestClient(inboxUrl);

  const res = await aggregateQueryResults<JSONTypes.SwapEvent>({
    ...args,
    query: postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.SwapEvent)
      .filter("data->results_in_state_transition", "eq", true)
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toSwapEvent(e)),
    errors: res.errors,
  };
};
