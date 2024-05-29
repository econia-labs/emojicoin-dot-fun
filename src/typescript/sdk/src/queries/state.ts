import { PostgrestClient } from "@supabase/postgrest-js";
import {
  type ContractTypes,
  toGlobalStateEvent,
  toStateEvent,
  toMarketRegistrationEvent,
} from "../types/contract-types";
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

export const getLastMarketState = async ({
  marketID,
  inboxUrl = INBOX_URL,
}: {
  marketID: string;
  inboxUrl?: string;
}) => {
  const postgrest = new PostgrestClient(inboxUrl);

  const { state, version: stateEventVersion } = await postgrest
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.StateEvent)
    .filter("data->market_metadata->>market_id", "eq", marketID)
    .order("transaction_version", ORDER_BY.DESC)
    .limit(1)
    .then((r) => ({
      version: r.data && r.data[0] ? r.data[0].transaction_version : null,
      state: r.data && r.data[0] ? (r.data[0].data as JSONTypes.StateEvent) : null,
      _stateError: r.error,
    }));

  const { market, version: marketRegistrationVersion } = await postgrest
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.MarketRegistrationEvent)
    .filter("data->market_metadata->>market_id", "eq", marketID)
    .then((r) => ({
      version: r.data && r.data[0] ? r.data[0].transaction_version : null,
      market: r.data && r.data[0] ? (r.data[0].data as JSONTypes.MarketRegistrationEvent) : null,
      _marketError: r.error,
    }));

  if ((!state && market) || (state && !market)) {
    throw new Error(
      "Market and state data are inconsistent. They should both either exist or not exist." +
        "Make sure the `.next` and `.turbo` caches are clear and try again."
    );
  }

  if (!state) {
    return null;
  }
  return {
    state: {
      ...toStateEvent(state),
      version: stateEventVersion as number,
    },
    market: {
      ...toMarketRegistrationEvent(market!),
      version: marketRegistrationVersion as number,
    },
  };
};

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
