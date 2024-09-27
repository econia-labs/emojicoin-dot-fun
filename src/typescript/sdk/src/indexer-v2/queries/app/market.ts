import "server-only";

import { LIMIT, ORDER_BY } from "../../../queries";
import { type AnyNumberString } from "../../../types";
import { TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";
import {
  toChatEventModel,
  toMarketState,
  toPeriodicStateEventModel,
  toSwapEventModel,
} from "../../types";
import { type PeriodicStateEventQueryArgs, type MarketStateQueryArgs } from "../../types/common";
import { type MarketSymbolEmojis } from "../../../emoji_data";

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
  offset,
  limit = LIMIT,
}: PeriodicStateEventQueryArgs) =>
  postgrest
    .from(TableName.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .gte("start_time", start.toISOString())
    .order("start_time", ORDER_BY.ASC)
    .range(offset, offset + limit - 1);

const selectMarketState = ({ searchEmojis }: { searchEmojis: MarketSymbolEmojis }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("symbol_emojis", toQueryArray(searchEmojis))
    .limit(1)
    .single();

export const fetchSwapEvents = queryHelper(selectSwapsByMarketID, toSwapEventModel);
export const fetchChatEvents = queryHelper(selectChatsByMarketID, toChatEventModel);
export const fetchPeriodicEventsSince = queryHelper(
  selectPeriodicEventsSince,
  toPeriodicStateEventModel
);
export const fetchMarketState = queryHelperSingle(selectMarketState, toMarketState);
