import "server-only";

import { type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { PostgrestClient } from "@supabase/postgrest-js";
import { type Period } from "../../const";
import { ORDER_BY } from "../../queries";
import { type AnyNumberString } from "../../types";
import { TableName } from "../types/snake-case-types";
import JSON_BIGINT from "../json-bigint";

/**
 * Fetch with BigInt support. This is necessary because the JSON returned by the indexer
 * contains BigInts, which are not supported by the default fetch implementation.
 */
const fetchPatch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return response;
  }

  const text = await response.text();
  const parsedWithBigInts = JSON_BIGINT.parse(text);
  const bigIntsAsStrings = JSON.stringify(parsedWithBigInts, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  return new Response(bigIntsAsStrings, response);
};

// Custom client that enforces a proper table name when calling `from`.
class CustomClient extends PostgrestClient {
  from = (table: TableName) => super.from(table);
}

export const postgrest = new CustomClient(process.env.INDEXER_URL!, { fetch: fetchPatch });

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

const selectPeriodicEventsByResolution = ({
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

const selectUserLiquidityPools = ({ provider }: { provider: AccountAddressInput }) =>
  postgrest
    .from(TableName.UserLiquidityPools)
    .select("*")
    .eq("provider", provider)
    .order("market_nonce", ORDER_BY.DESC);

const selectMarket1MPeriodsInLastDay = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.Market1MPeriodsInLastDay)
    .select("market_id, start_time, volume")
    .eq("market_id", marketID);

const selectMarketDailyVolume = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.MarketDailyVolume)
    .select("market_id, daily_volume")
    .eq("market_id", marketID);

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
  selectPeriodicEventsByResolution,
  selectMarketLatestStateEvents,
  selectMarketsPostBondingCurve,
  selectUniqueMarkets,
  selectUserLiquidityPools,
  selectMarket1MPeriodsInLastDay,
  selectMarketDailyVolume,
  selectLiquidityEvents,
};
