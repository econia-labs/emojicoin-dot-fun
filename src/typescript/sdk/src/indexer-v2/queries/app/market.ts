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
import { type PeriodicStateEventQueryArgs } from "../../types/common";
import { type SymbolEmoji } from "../../../emoji_data/types";

const selectSwapsByMarketID = ({
  marketID,
  fromMarketNonce = null,
  amount = 20,
}: {
  marketID: AnyNumberString;
  fromMarketNonce?: number | null;
  amount?: number;
}) => {
  if (fromMarketNonce !== null) {
    return postgrest
      .from(TableName.SwapEvents)
      .select("*")
      .eq("market_id", marketID)
      .lte("market_nonce", fromMarketNonce)
      .order("market_nonce", ORDER_BY.DESC)
      .limit(amount);
  }
  return postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .limit(amount);
};

const selectChatsByMarketID = ({
  marketID,
  fromMarketNonce = null,
  amount = 20,
}: {
  marketID: AnyNumberString;
  fromMarketNonce?: number | null;
  amount?: number;
}) => {
  if (fromMarketNonce !== null) {
    return postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("market_id", marketID)
      .lte("market_nonce", fromMarketNonce)
      .order("market_nonce", ORDER_BY.DESC)
      .limit(amount);
  }
  return postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .limit(amount);
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

export const fetchSwapEvents = queryHelper(selectSwapsByMarketID, toSwapEventModel);
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
