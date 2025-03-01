if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { LIMIT, ORDER_BY } from "../../const";
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
import { type PeriodicStateEventQueryArgs, type MarketStateQueryArgs } from "../../types/common";
import { type SymbolEmoji } from "../../../emoji_data/types";

const selectSwapsBySender = ({
  sender,
  marketID,
  page = 1,
  pageSize = LIMIT,
}: { sender: string; marketID?: AnyNumberString } & MarketStateQueryArgs) => {
  const query = postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("sender", sender)
    .order("transaction_version", ORDER_BY.DESC)
    .order("event_index", ORDER_BY.DESC)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (marketID) {
    query.eq("market_id", marketID);
  }

  return query;
};

const countSwapsBySender = ({ sender }: { sender: string }) => {
  return postgrest
    .from(TableName.SwapEvents)
    .select("*", { count: "exact", head: true })
    .eq("sender", sender);
};

const selectSwapsByMarketID = ({
  marketID,
  page = 1,
  pageSize = LIMIT,
}: { marketID: AnyNumberString } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectChatsByMarketID = ({
  marketID,
  page = 1,
  pageSize = LIMIT,
}: { marketID: AnyNumberString } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .range((page - 1) * pageSize, page * pageSize - 1);

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

export const fetchSenderSwapEvents = queryHelper(selectSwapsBySender, toSwapEventModel);
export const countSenderSwapEvents = async (sender: string): Promise<number> => {
  const { count } = await countSwapsBySender({ sender });
  return count ?? 0;
};
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
