import "server-only";

import { TableName } from "../types/snake-case-types";
import {
  toChatEventModel,
  toLiquidityEventModel,
  toMarketLatestStateEventModel,
  toPeriodicStateEventModel,
  toSwapEventModel,
  toUserLiquidityPoolsModel,
} from "../types";
import { withQueryConfig } from "./utils";
import {
  selectSwapsByMarketID,
  selectChatsByMarketID,
  selectPeriodicEventsByResolution,
  selectMarketLatestStateEvents,
  selectMarketsPostBondingCurve,
  selectUserLiquidityPools,
  selectMarket1MPeriodsInLastDay,
  selectMarketDailyVolume,
  selectUniqueMarkets,
  selectLiquidityEvents,
  selectAllMarketsDailyVolume,
} from "./base";

// -------------------------------------------------------------------------------------------------
//
//
//                           Curried queries (only for queries with indexes)
//
//
// -------------------------------------------------------------------------------------------------
const fetchSwaps = withQueryConfig(selectSwapsByMarketID, toSwapEventModel, TableName.SwapEvents);
const fetchChats = withQueryConfig(selectChatsByMarketID, toChatEventModel, TableName.ChatEvents);
const fetchPeriodicEvents = withQueryConfig(
  selectPeriodicEventsByResolution,
  toPeriodicStateEventModel,
  TableName.PeriodicStateEvents
);
const fetchMarketLatestStateEvents = withQueryConfig(
  selectMarketLatestStateEvents,
  toMarketLatestStateEventModel,
  TableName.MarketLatestStateEvent
);
const fetchMarketsPostBondingCurve = withQueryConfig(
  selectMarketsPostBondingCurve,
  (r) => ({
    marketID: r.market_id,
  }),
  TableName.MarketLatestStateEvent
);
const fetchUniqueMarkets = withQueryConfig(
  selectUniqueMarkets,
  (r) => ({
    marketID: r.market_id,
  }),
  TableName.MarketLatestStateEvent
);
const fetchUserLiquidityPools = withQueryConfig(
  selectUserLiquidityPools,
  toUserLiquidityPoolsModel,
  TableName.UserLiquidityPools
);
const fetchMarket1MPeriodsInLastDay = withQueryConfig(
  selectMarket1MPeriodsInLastDay,
  (r) => ({
    startTime: BigInt(r.start_time),
    volume: BigInt(r.volume),
  }),
  TableName.Market1MPeriodsInLastDay
);
const fetchMarketDailyVolume = withQueryConfig(
  selectMarketDailyVolume,
  (r) => ({
    dailyVolume: BigInt(r.daily_volume),
  }),
  TableName.MarketDailyVolume
);
const fetchAllMarketsDailyVolume = withQueryConfig(
  selectAllMarketsDailyVolume,
  (r) => ({
    marketID: BigInt(r.market_id),
    dailyVolume: BigInt(r.daily_volume),
  }),
  TableName.MarketDailyVolume
);
const fetchLiquidityEvents = withQueryConfig(
  selectLiquidityEvents,
  toLiquidityEventModel,
  TableName.LiquidityEvents
);

export {
  fetchSwaps,
  fetchChats,
  fetchPeriodicEvents,
  fetchLiquidityEvents,
  fetchMarketLatestStateEvents,
  fetchMarketsPostBondingCurve,
  fetchUniqueMarkets,
  fetchUserLiquidityPools,
  fetchMarket1MPeriodsInLastDay,
  fetchMarketDailyVolume,
  fetchAllMarketsDailyVolume,
};
