import "server-only";

import { type Account } from "@aptos-labs/ts-sdk";
import { type Period } from "../../const";
import { ORDER_BY } from "../../queries";
import { type AnyNumberString } from "../../types";
import { TableName } from "../types/snake-case-types";
import { postgrest } from "./client";
import { toAccountAddressString } from "../../utils";

const selectSwapsByMarketID = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC);

const selectChatsByMarketID = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC);

const selectPeriodicEventsByPeriod = ({
  marketID,
  period,
  startTime,
}: {
  marketID: AnyNumberString;
  period: Period;
  startTime: Date;
}) =>
  postgrest
    .from(TableName.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .gte("start_time", startTime)
    .order("start_time", ORDER_BY.ASC);

const selectMarketLatestStateEvents = ({ marketID }: { marketID?: AnyNumberString }) =>
  (typeof marketID === "undefined"
    ? postgrest.from(TableName.MarketLatestStateEvent).select("*")
    : postgrest.from(TableName.MarketLatestStateEvent).select("*").eq("market_id", marketID)
  ).order("market_nonce", ORDER_BY.DESC);

const selectMarketsPostBondingCurve = () =>
  postgrest
    .from(TableName.MarketLatestStateEvent)
    .select("market_id")
    .eq("in_bonding_curve", false);

const selectUniqueMarkets = () =>
  postgrest.from(TableName.MarketLatestStateEvent).select("market_id");

const selectUserLiquidityPools = ({ provider }: { provider: Account }) =>
  postgrest
    .from(TableName.UserLiquidityPools)
    .select("*")
    .eq("provider", toAccountAddressString(provider))
    .order("market_nonce", ORDER_BY.DESC);

const selectMarket1MPeriodsInLastDay = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.Market1MPeriodsInLastDay)
    .select("start_time, volume")
    .eq("market_id", marketID);

// prettier-ignore
const selectMarketDailyVolume = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.MarketDailyVolume)
    .select("daily_volume")
    .eq("market_id", marketID);

// prettier-ignore
const selectAllMarketsDailyVolume = () =>
  postgrest
    .from(TableName.MarketDailyVolume)
    .select("daily_volume");

/**
 * NOTE: This query is not optimized, it's merely used for testing purposes to check the validity
 * of the values in the `liquidity_events` table.
 */
const selectLiquidityEvents = ({
  marketID,
  marketNonce,
}: {
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
}) =>
  postgrest
    .from(TableName.LiquidityEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("market_nonce", marketNonce);

export {
  selectSwapsByMarketID,
  selectChatsByMarketID,
  selectPeriodicEventsByPeriod,
  selectMarketLatestStateEvents,
  selectMarketsPostBondingCurve,
  selectUniqueMarkets,
  selectUserLiquidityPools,
  selectMarket1MPeriodsInLastDay,
  selectMarketDailyVolume,
  selectAllMarketsDailyVolume,
  selectLiquidityEvents,
};
