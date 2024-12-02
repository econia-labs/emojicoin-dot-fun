if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { ORDER_BY } from "../../../queries";
import { type AnyNumberString } from "../../../types";
import { TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";
import {
  toChatEventModel,
  toMarketRegistrationEventModel,
  toMarketStateModel,
  toPeriodicStateEventModel,
  toSwapEventModel,
} from "../../types";
import type {
  PeriodicStateEventToQueryArgs,
  PeriodicStateEventQueryArgs,
} from "../../types/common";
import { type SymbolEmoji } from "../../../emoji_data/types";

const selectSwapsByMarketID = ({
  marketID,
  toMarketNonce = null,
  amount = 20,
  order = "DESC",
}: {
  marketID: AnyNumberString;
  toMarketNonce?: number | null;
  amount?: number;
  order?: keyof typeof ORDER_BY;
}) => {
  if (toMarketNonce !== null) {
    return postgrest
      .from(TableName.SwapEvents)
      .select("*")
      .eq("market_id", marketID)
      .lte("market_nonce", toMarketNonce)
      .order("market_nonce", ORDER_BY[order])
      .limit(amount);
  }
  return postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY[order])
    .limit(amount);
};

const selectSwapsByNonce = ({
  marketID,
  fromMarketNonce,
  toMarketNonce,
}: {
  marketID: AnyNumberString;
  fromMarketNonce: number;
  toMarketNonce: number;
}) => {
  return postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .lt("market_nonce", toMarketNonce)
    .gte("market_nonce", fromMarketNonce)
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC);
};

const selectChatsByMarketID = ({
  marketID,
  toMarketNonce = null,
  amount = 20,
  order = "DESC",
}: {
  marketID: AnyNumberString;
  toMarketNonce?: number | null;
  amount?: number;
  order?: keyof typeof ORDER_BY;
}) => {
  if (toMarketNonce !== null) {
    return postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("market_id", marketID)
      .lte("market_nonce", toMarketNonce)
      .order("market_nonce", ORDER_BY[order])
      .limit(amount);
  }
  return postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY[order])
    .limit(amount);
};

const selectChatsByNonce = ({
  marketID,
  fromMarketNonce,
  toMarketNonce,
}: {
  marketID: AnyNumberString;
  fromMarketNonce: number;
  toMarketNonce: number;
}) => {
  return postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .lt("market_nonce", toMarketNonce)
    .gte("market_nonce", fromMarketNonce)
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC);
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

export const fetchSwapEvents = queryHelper(selectSwapsByMarketID, toSwapEventModel);
export const fetchSwapEventsByNonce = queryHelper(selectSwapsByNonce, toSwapEventModel);
export const fetchChatEvents = queryHelper(selectChatsByMarketID, toChatEventModel);
export const fetchChatEventsByNonce = queryHelper(selectChatsByNonce, toChatEventModel);
export const fetchPeriodicEventsSince = queryHelper(
  selectPeriodicEventsSince,
  toPeriodicStateEventModel
);
export const fetchPeriodicEventsTo = queryHelper(selectPeriodicEventsTo, toPeriodicStateEventModel);
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

export const tryFetchFirstChatEvent = async (marketID: AnyNumberString) =>
  fetchChatEvents({ marketID, amount: 1, order: "ASC" }).then((res) => {
    if (res && res[0]) {
      return Number(res[0].market.marketNonce);
    }
    throw new Error("Market is not yet registered.");
  });

export const tryFetchFirstSwapEvent = async (marketID: AnyNumberString) =>
  fetchSwapEvents({ marketID, amount: 1, order: "ASC" }).then((res) => {
    if (res && res[0]) {
      return Number(res[0].market.marketNonce);
    }
    throw new Error("Market is not yet registered.");
  });
