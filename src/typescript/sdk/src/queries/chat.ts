import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL } from "../const";
import { TABLE_NAME, ORDER_BY } from "./const";
import { STRUCT_STRINGS } from "../utils";
import { type ContractTypes, type JSONTypes, toChatEvent } from "../types";
import { wrap } from "./utils";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";

export type ChatEventQueryArgs = {
  marketID: number | bigint;
  inboxUrl?: string;
};

export const paginateChatEvents = async (
  args: ChatEventQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.ChatEvent>> => {
  const { marketID, inboxUrl = INBOX_URL } = args;
  const query = new PostgrestClient(inboxUrl)
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.ChatEvent)
    .eq("data->market_metadata->market_id", wrap(marketID))
    .order("transaction_version", ORDER_BY.DESC);

  const { data, errors } = await aggregateQueryResults<JSONTypes.ChatEvent>({ query });

  return {
    events: data.map((e) => toChatEvent(e)),
    errors,
  };
};
