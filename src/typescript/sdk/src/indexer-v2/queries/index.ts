import "server-only";

import {
  toChatEventModel,
  toLiquidityEventModel,
  toMarket1MPeriodsInLastDay,
  toMarketLatestStateEventModel,
  toPeriodicStateEventModel,
  toSwapEventModel,
  toUserLiquidityPoolsModel,
} from "../types";
import { withQueryConfig } from "./utils";
import {
  selectSwapsByMarketID,
  selectChatsByMarketID,
  selectPeriodicEventsByPeriod,
  selectLatestStateEventForMarket,
  selectUserLiquidityPools,
  selectMarket1MPeriodsInLastDay,
  selectMarketDailyVolume,
  selectLiquidityEvents,
} from "./base";

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
  selectPeriodicEventsByPeriod,
  toPeriodicStateEventModel
);

const fetchLatestStateEventForMarket = withQueryConfig(
  selectLatestStateEventForMarket,
  toMarketLatestStateEventModel
);

const fetchUserLiquidityPools = withQueryConfig(
  selectUserLiquidityPools,
  toUserLiquidityPoolsModel
);

const fetchMarket1MPeriodsInLastDay = withQueryConfig(
  selectMarket1MPeriodsInLastDay,
  toMarket1MPeriodsInLastDay
);

const fetchDailyVolumeForMarket = withQueryConfig(selectMarketDailyVolume, (r) => ({
  dailyVolume: BigInt(r.daily_volume),
}));

const fetchLiquidityEvents = withQueryConfig(selectLiquidityEvents, toLiquidityEventModel);

export {
  fetchSwaps,
  fetchChats,
  fetchPeriodicEvents,
  fetchLiquidityEvents,
  fetchLatestStateEventForMarket,
  fetchUserLiquidityPools,
  fetchMarket1MPeriodsInLastDay,
  fetchDailyVolumeForMarket,
};
