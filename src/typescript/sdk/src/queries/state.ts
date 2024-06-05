import "server-only";

import { type Types, toGlobalStateEvent, toStateEvent, toMarketDataView } from "../types";
import { STRUCT_STRINGS } from "../utils/type-tags";
import { INBOX_EVENTS_TABLE, MARKET_DATA_VIEW, ORDER_BY } from "./const";
import { wrap } from "./utils";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";
import type JSONTypes from "../types/json-types";
import { postgrest } from "./inbox-url";

export const getLatestMarketState = async ({
  marketID,
}: {
  marketID: string | number | bigint;
}) => {
  if (BigInt(marketID) > Number.MAX_SAFE_INTEGER) {
    throw new Error("Too many market IDs to convert to a `Number` safely.");
  }

  const { latestState } = await postgrest
    .from(MARKET_DATA_VIEW)
    .select("*")
    .filter("market_id", "eq", Number(marketID))
    .then((r) => ({
      latestState: r.data && r.data[0] ? (r.data[0] as JSONTypes.MarketDataView) : null,
      _error: r.error,
    }));

  return latestState ? toMarketDataView(latestState) : null;
};

export const paginateGlobalStateEvents = async (
  args: Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<Types.GlobalStateEvent>> => {
  const res = await aggregateQueryResults<JSONTypes.GlobalStateEvent>({
    ...args,
    query: postgrest
      .from(INBOX_EVENTS_TABLE)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.GlobalStateEvent)
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toGlobalStateEvent(e, e.version)),
    errors: res.errors,
  };
};

export type PaginateStateEventsByMarketIDQueryArgs = {
  marketID: number | bigint;
};

export const paginateStateEventsByMarketID = async (
  args: PaginateStateEventsByMarketIDQueryArgs
): Promise<EventsAndErrors<Types.StateEvent>> => {
  const { marketID } = args;
  const res = await aggregateQueryResults<JSONTypes.StateEvent>({
    query: postgrest
      .from(INBOX_EVENTS_TABLE)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.StateEvent)
      .eq("data->market_metadata->market_id", wrap(marketID))
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    events: res.data.map((e) => toStateEvent(e, e.version)),
    errors: res.errors,
  };
};
