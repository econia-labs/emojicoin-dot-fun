import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL } from "../const";
import { type ContractTypes, type JSONTypes, toLiquidityEvent } from "../types";
import { STRUCT_STRINGS } from "../utils";
import { TABLE_NAME, ORDER_BY } from "./const";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import { wrap } from "./utils";

export enum LiquidityEventType {
  Provide,
  Remove,
}

export type LiquidityEventQueryArgs = {
  user?: string;
  marketID?: number | bigint;
  liquidityEventType?: LiquidityEventType;
  inboxUrl?: string;
};

export const paginateLiquidityEvents = async (
  args: LiquidityEventQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.LiquidityEvent>> => {
  const { user, marketID, liquidityEventType, inboxUrl = INBOX_URL } = args;
  let query = new PostgrestClient(inboxUrl)
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.LiquidityEvent)
    .order("transaction_version", ORDER_BY.DESC);

  // If these arguments are provided, add them to the query filters.
  query = user ? query.eq("data->provider", wrap(user)) : query;
  query = marketID ? query.eq("data->market_id", wrap(marketID)) : query;
  query = liquidityEventType
    ? query.eq("data->liquidity_provided", wrap(liquidityEventType))
    : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.LiquidityEvent>({ query });

  return {
    events: data.map((e) => toLiquidityEvent(e)),
    errors,
  };
};
