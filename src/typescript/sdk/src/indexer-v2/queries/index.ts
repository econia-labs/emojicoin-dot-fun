// import "server-only";

import {
  PostgrestClient,
  PostgrestFilterBuilder,
  PostgrestSingleResponse,
} from "@supabase/postgrest-js";
import { TableNames } from "../types/snake-case-types";
import { ORDER_BY } from "../../queries";
import { AnyNumberString } from "../../types";
import { AccountAddressInput } from "@aptos-labs/ts-sdk";
import {
  Period,
  toChatEventModel,
  toMarketLatestStateEventModel,
  toPeriodicStateEventModel,
  toSwapEventModel,
  toUserLiquidityPoolsModel,
} from "../types";

type QueryFunction<
  Row extends Record<string, unknown>,
  Result,
  RelationName,
  Relationships,
  QueryArgs extends Record<string, any> | undefined,
> = (args: QueryArgs) => PostgrestFilterBuilder<any, Row, Result, RelationName, Relationships>;

interface PaginationArgs {
  limit?: number;
  offset?: number;
}

// -------------------------------------------------------------------------------------------------
//
//
//                                          Base queries
//
//
// -------------------------------------------------------------------------------------------------
const client = new PostgrestClient(process.env.INDEXER_URL!);

const selectSwapsByMarketID = ({ marketID }: { marketID: AnyNumberString }) =>
  client
    .from(TableNames.SwapEvents)
    .select("*")
    .eq("market_id", marketID)
    .order("market_nonce", ORDER_BY.DESC);

const selectChatsByMarketID = ({ marketID }: { marketID: AnyNumberString }) =>
  client
    .from(TableNames.ChatEvents)
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
  client
    .from(TableNames.PeriodicStateEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("period", period)
    .gte("start_time", startTime)
    .order("start_time", ORDER_BY.ASC);

const selectMarketLatestStateEvents = () =>
  client.from(TableNames.MarketLatestStateEvent).select("*");

const selectMarketsPostBondingCurve = () =>
  client.from(TableNames.MarketLatestStateEvent).select("market_id").eq("in_bonding_curve", false);

const selectUniqueMarkets = () =>
  client.from(TableNames.MarketLatestStateEvent).select("market_id");

const selectUserLiquidityPools = ({ provider }: { provider: AccountAddressInput }) =>
  client
    .from(TableNames.UserLiquidityPools)
    .select("*")
    .eq("provider", provider)
    .order("market_nonce", ORDER_BY.DESC);

const selectMarket1MPeriodsInLastDay = ({ marketID }: { marketID: AnyNumberString }) =>
  client
    .from(TableNames.Market1MPeriodsInLastDay)
    .select("market_id, start_time, volume")
    .eq("market_id", marketID);

const selectMarketDailyVolume = ({ marketID }: { marketID: AnyNumberString }) =>
  client
    .from(TableNames.MarketDailyVolume)
    .select("market_id, daily_volume")
    .eq("market_id", marketID);

const extractRows = <T>(res: PostgrestSingleResponse<Array<T>>) => res.data ?? ([] as T[]);

/**
 *
 * @param queryFn Takes in a query function and returns a curried version of it that accepts
 * pagination arguments and returns the extracted data
 * @param convert A function that converts the raw row data into the desired output, usually
 * by converting it into a camelCased representation of the database row.
 * @returns queryFn(args: QueryArgs & PaginationArgs) => Promise<OutputType[]>
 * where OutputType is the result of convert<Row>(row: Row).
 */
function withLimitAndOffset<
  Row extends Record<string, unknown>,
  Result extends Row[],
  RelationName,
  Relationships,
  QueryArgs extends Record<string, any> | undefined,
  OutputType,
>(
  queryFn: QueryFunction<Row, Result, RelationName, Relationships, QueryArgs>,
  convert: (rows: Row) => OutputType
): (args: QueryArgs & PaginationArgs) => Promise<OutputType[]> {
  const paginatedQuery = async (args: QueryArgs & PaginationArgs) => {
    const { limit, offset, ...queryArgs } = args;
    let query = queryFn(queryArgs as QueryArgs);

    if (typeof limit === "number") {
      query = query.limit(limit);
    }

    if (typeof offset === "number" && typeof limit === "number") {
      query = query.range(offset, offset + limit - 1);
    }

    const res = await query;
    const rows = extractRows<Row>(res);
    return rows.map((row) => convert(row));
  };

  return paginatedQuery;
}

// -------------------------------------------------------------------------------------------------
//
//
//                                        Curried queries
//
//
// -------------------------------------------------------------------------------------------------
const fetchSwaps = withLimitAndOffset(selectSwapsByMarketID, toSwapEventModel);
const fetchChats = withLimitAndOffset(selectChatsByMarketID, toChatEventModel);
const fetchPeriodicEvents = withLimitAndOffset(
  selectPeriodicEventsByResolution,
  toPeriodicStateEventModel
);
const fetchMarketLatestStateEvents = withLimitAndOffset(
  selectMarketLatestStateEvents,
  toMarketLatestStateEventModel
);
const fetchMarketsPostBondingCurve = withLimitAndOffset(selectMarketsPostBondingCurve, (r) => ({
  marketID: r.market_id,
}));
const fetchUniqueMarkets = withLimitAndOffset(selectUniqueMarkets, (r) => ({
  marketID: r.market_id,
}));
const fetchUserLiquidityPools = withLimitAndOffset(
  selectUserLiquidityPools,
  toUserLiquidityPoolsModel
);
const fetchMarket1MPeriodsInLastDay = withLimitAndOffset(selectMarket1MPeriodsInLastDay, (r) => ({
  marketID: r.market_id,
  startTime: r.start_time,
  volume: r.volume,
}));
const fetchMarketDailyVolume = withLimitAndOffset(selectMarketDailyVolume, (r) => ({
  marketID: r.market_id,
  dailyVolume: r.daily_volume,
}));

export {
  fetchSwaps,
  fetchChats,
  fetchPeriodicEvents,
  fetchMarketLatestStateEvents,
  fetchMarketsPostBondingCurve,
  fetchUniqueMarkets,
  fetchUserLiquidityPools,
  fetchMarket1MPeriodsInLastDay,
  fetchMarketDailyVolume,
};
