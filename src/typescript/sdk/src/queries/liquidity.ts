import "server-only";

import { type Types, type JSONTypes, toLiquidityEvent } from "../types";
import { INBOX_EVENTS_TABLE, LIMIT, ORDER_BY } from "./const";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import { postgrest } from "./inbox-url";

export enum LiquidityEventType {
  Provide,
  Remove,
}

export type LiquidityEventQueryArgs = {
  user?: string;
  marketID?: number | bigint;
  liquidityEventType?: LiquidityEventType;
};

export const paginateLiquidityEvents = async (
  args: LiquidityEventQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<Types.LiquidityEvent>> => {
  const { user, marketID, liquidityEventType } = args;
  let query = postgrest
    .from(INBOX_EVENTS_TABLE)
    .select("*")
    .filter("event_name", "eq", "emojicoin_dot_fun::Liquidity")
    .limit(Math.min(LIMIT, args.maxTotalRows ?? Infinity))
    .order("transaction_version", ORDER_BY.DESC);

  // If these arguments are provided, add them to the query filters.
  query = user ? query.eq("data->>provider", user) : query;
  query = marketID ? query.eq("data->>market_id", marketID) : query;
  query = liquidityEventType ? query.eq("data->>liquidity_provided", liquidityEventType) : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.LiquidityEvent>({
    query,
    ...args,
  });

  return {
    events: data.map((e) => toLiquidityEvent(e, e.version)),
    errors,
  };
};
