import "server-only";

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
import { postgresTimestampToMicroseconds } from "../types/snake-case-types";

// -------------------------------------------------------------------------------------------------
//
//
//                           Curried queries (only for queries with indexes)
//
//
// -------------------------------------------------------------------------------------------------
const fetchSwaps = withQueryConfig(selectSwapsByMarketID, toSwapEventModel);
const fetchChats = withQueryConfig(selectChatsByMarketID, toChatEventModel);
const fetchPeriodicEvents = withQueryConfig(
  selectPeriodicEventsByResolution,
  toPeriodicStateEventModel
);
const fetchMarketLatestStateEvents = withQueryConfig(
  selectMarketLatestStateEvents,
  toMarketLatestStateEventModel
);
const fetchMarketsPostBondingCurve = withQueryConfig(selectMarketsPostBondingCurve, (r) => ({
  marketID: r.market_id,
}));
const fetchUniqueMarkets = withQueryConfig(selectUniqueMarkets, (r) => ({
  marketID: r.market_id,
}));
const fetchUserLiquidityPools = withQueryConfig(
  selectUserLiquidityPools,
  toUserLiquidityPoolsModel
);
const fetchMarket1MPeriodsInLastDay = withQueryConfig(selectMarket1MPeriodsInLastDay, (r) => ({
  startTime: postgresTimestampToMicroseconds(r.start_time),
  volume: BigInt(r.volume),
}));
const fetchMarketDailyVolume = withQueryConfig(selectMarketDailyVolume, (r) => ({
  dailyVolume: BigInt(r.daily_volume),
}));
const fetchAllMarketsDailyVolume = withQueryConfig(selectAllMarketsDailyVolume, (r) => ({
  marketID: BigInt(r.market_id),
  dailyVolume: BigInt(r.daily_volume),
}));
const fetchLiquidityEvents = withQueryConfig(selectLiquidityEvents, toLiquidityEventModel);

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
