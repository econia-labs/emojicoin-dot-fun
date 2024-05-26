import { PostgrestClient } from "@supabase/postgrest-js";
import { type ContractTypes, toGlobalStateEvent, toStateEvent } from "../types/contract-types";
import { INBOX_URL } from "../const";
import { STRUCT_STRINGS } from "../utils/type-tags";
import { TABLE_NAME, ORDER_BY } from "./const";
import { wrap } from "./utils";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import type JSONTypes from "../types/json-types";

export const paginateGlobalStateEvents = async (
  args: Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.GlobalStateEvent>> => {
  const inboxUrl = args?.inboxUrl ?? INBOX_URL;
  const postgrest = new PostgrestClient(inboxUrl);

  const res = await aggregateQueryResults<JSONTypes.GlobalStateEvent>({
    ...args,
    query: postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.GlobalStateEvent)
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toGlobalStateEvent(e)),
    errors: res.errors,
  };
};

export type PaginateStateEventsByMarketIDQueryArgs = {
  marketID: number | bigint;
  inboxUrl?: string;
};

export const paginateStateEventsByMarketID = async (
  args: PaginateStateEventsByMarketIDQueryArgs
): Promise<EventsAndErrors<ContractTypes.StateEvent>> => {
  const { inboxUrl = INBOX_URL, marketID } = args;
  const postgrest = new PostgrestClient(inboxUrl);

  const res = await aggregateQueryResults<JSONTypes.StateEvent>({
    query: postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.StateEvent)
      .eq("data->market_metadata->market_id", wrap(marketID))
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toStateEvent(e)),
    errors: res.errors,
  };
};
