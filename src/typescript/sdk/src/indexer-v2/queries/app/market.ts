import "server-only";

import type { AccountAddress } from "@aptos-labs/ts-sdk";

import type { SymbolEmoji } from "../../../emoji_data/types";
import type { AnyNumberString } from "../../../types";
import { LIMIT, ORDER_BY } from "../../const";
import {
  toChatEventModel,
  toMarketRegistrationEventModel,
  toMarketStateModel,
  toPeriodicStateEventModel,
  toSwapEventModel,
} from "../../types";
import type {
  MarketStateQueryArgs,
  PeriodicStateEventQueryArgs,
  PeriodicStateEventToQueryArgs,
} from "../../types/common";
import { TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";

const selectSwaps = ({
  sender,
  marketID,
  page = 1,
  symbolEmojis,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
}: {
  sender?: AccountAddress;
  marketID?: AnyNumberString;
  symbolEmojis?: SymbolEmoji[];
} & MarketStateQueryArgs) => {
  const query = postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .order("transaction_version", orderBy)
    .order("event_index", orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (sender) query.eq("sender", sender);

  if (marketID) query.eq("market_id", marketID);

  if (symbolEmojis) query.eq("symbol_emojis", toQueryArray(symbolEmojis));

  return query;
};

const countSwapsBySender = ({ sender }: { sender: string }) => {
  return postgrest
    .from(TableName.SwapEvents)
    .select("*", { count: "exact", head: true })
    .eq("sender", sender);
};

const selectChatsByMarketID = ({
  marketID,
  page = 1,
  pageSize = LIMIT,
}: { marketID: AnyNumberString | AnyNumberString[] } & MarketStateQueryArgs) => {
  const query = postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .order("transaction_version", ORDER_BY.DESC)
    .order("event_index", ORDER_BY.DESC)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (Array.isArray(marketID)) {
    query.in("market_id", marketID);
  } else {
    query.eq("market_id", marketID);
  }

  return query;
};

const selectPeriodicEventsTo = ({
  marketID,
  period,
  end,
  amount,
}: PeriodicStateEventToQueryArgs) => {
  const query = postgrest
    .from(TableName.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .lt("start_time", end.toISOString())
    .limit(amount)
    .order("start_time", ORDER_BY.DESC);
  return query;
};

// This query uses `offset` instead of `page` because the periodic state events query requires
// more granular pagination due to the requirements of the private TradingView charting library.
const selectPeriodicEventsSince = ({
  marketID,
  period,
  start,
  end,
}: PeriodicStateEventQueryArgs) => {
  const query = postgrest
    .from(TableName.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .gte("start_time", start.toISOString())
    .lt("start_time", end.toISOString())
    .order("start_time", ORDER_BY.ASC);
  return query;
};

const selectMarketState = ({ searchEmojis }: { searchEmojis: SymbolEmoji[] }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("symbol_emojis", toQueryArray(searchEmojis))
    .limit(1)
    .maybeSingle();

const selectMarketRegistration = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.MarketRegistrationEvents)
    .select("*")
    .eq("market_id", marketID)
    .limit(1)
    .single();

export const fetchSwapEvents = queryHelper(selectSwaps, toSwapEventModel);
export const countSenderSwapEvents = async (sender: string): Promise<number> => {
  const { count } = await countSwapsBySender({ sender });
  return count ?? 0;
};

export const fetchChatEvents = queryHelper(selectChatsByMarketID, toChatEventModel);
export const fetchPeriodicEventsSince = queryHelper(
  selectPeriodicEventsSince,
  toPeriodicStateEventModel
);
export const fetchMarketState = queryHelperSingle(selectMarketState, toMarketStateModel);
export const fetchMarketRegistration = queryHelperSingle(
  selectMarketRegistration,
  toMarketRegistrationEventModel
);

export const tryFetchMarketRegistration = async (marketID: AnyNumberString) =>
  fetchMarketRegistration({ marketID }).then((res) => {
    if (res) {
      return Number(res.market.time / 1000n / 1000n);
    }
    throw new Error("Market is not yet registered.");
  });

export const fetchPeriodicEventsTo = queryHelper(selectPeriodicEventsTo, toPeriodicStateEventModel);
