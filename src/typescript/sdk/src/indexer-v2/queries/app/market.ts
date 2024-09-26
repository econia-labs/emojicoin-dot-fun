import "server-only";

import { type PostgrestBuilder } from "@supabase/postgrest-js";
import { LIMIT, ORDER_BY } from "../../../queries";
import { type AnyNumberString } from "../../../types";
import { type DatabaseType, TableName } from "../../types/json-types";
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
  limit = LIMIT,
}: { marketID: AnyNumberString } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .range((page - 1) * limit, page * limit - 1)
    .limit(limit);

const selectChatsByMarketID = ({
  marketID,
  page = 1,
  limit = LIMIT,
}: { marketID: AnyNumberString } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC)
    .range((page - 1) * limit, page * limit - 1)
    .limit(limit);

// This query uses `offset` instead of `page` because the periodic state events query requires
// more granular pagination due to the requirements of the private TradingView charting library.
const selectPeriodicEventsSince = ({
  marketID,
  period,
  start,
  offset,
  limit = LIMIT,
}: {
  marketID: AnyNumberString;
  start: Date;
} & PeriodicStateEventQueryArgs) =>
  postgrest
    .from(TableName.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .gte("start_time", start)
    .order("start_time", ORDER_BY.ASC)
    .range(offset, offset + limit - 1)
    .limit(limit);

// prettier-ignore
const selectMarketState = ({ marketEmojis }: { marketEmojis: MarketSymbolEmojis }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("symbol_emojis", toQueryArray(marketEmojis))
    .limit(1)
    .single() as PostgrestBuilder<DatabaseType["market_state"]>;

export const fetchSwapEvents = queryHelper(selectSwapsByMarketID, toSwapEventModel);
export const fetchChatEvents = queryHelper(selectChatsByMarketID, toChatEventModel);
export const fetchPeriodicEventsSince = queryHelper(
  selectPeriodicEventsSince,
  toPeriodicStateEventModel
);
export const fetchMarketState = queryHelperSingle(selectMarketState, toMarketState);
