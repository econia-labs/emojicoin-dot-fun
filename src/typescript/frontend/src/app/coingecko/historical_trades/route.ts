import { postgrest } from "@sdk/indexer-v2/queries/client";
import { TableName } from "@sdk/indexer-v2/types";
import Big from "big.js";
import type { NextRequest } from "next/server";
import { stringifyJSON } from "utils";

/**
 * @see {@link https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit?tab=t.0}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const { tickerId, type, startTime, endTime, limit } = {
    tickerId: searchParams.get("ticker_id"),
    type: searchParams.get("type"),
    startTime: searchParams.get("start_time"),
    endTime: searchParams.get("end_time"),
    limit: Number(searchParams.get("limit") ?? 500),
  };

  if (type && type !== "buy" && type !== "sell")
    return new Response("Invalid type.", { status: 400 });
  if (limit > 500) return new Response("Max limit is 500.", { status: 400 });
  if (limit < 1) return new Response("Min limit is 1.", { status: 400 });
  if (startTime && (isNaN(Number(startTime)) || Number(startTime) < 1))
    return new Response("Start time is not a valid unix timestamp.", { status: 400 });
  if (endTime && (isNaN(Number(endTime)) || Number(endTime) < 1))
    return new Response("End time is not a valid unix timestamp.", { status: 400 });

  let query = postgrest
    .from(TableName.SwapEvents)
    .select("market_nonce, avg_execution_price_q64, base_volume, quote_volume, bump_time, is_sell");

  if (tickerId) query = query.eq("market_address", tickerId.split("_")[0].split("::")[0]);
  if (type) query = query.eq("is_sell", type === "sell");
  if (startTime) query = query.gte("bump_time", new Date(Number(startTime) * 1000).toISOString());
  if (endTime) query = query.lte("bump_time", new Date(Number(endTime) * 1000).toISOString());
  query = query.limit(limit);
  query = query.order("block_number, transaction_version, event_index");

  const swaps = await query;

  const data = swaps.data?.map((e) => ({
    trade_id: e.market_nonce.toString(),
    price: Big(e.avg_execution_price_q64).div(Big(2).pow(64)).toString(),
    base_volume: Big(e.base_volume)
      .div(10 ** 8)
      .toString(),
    target_volume: Big(e.quote_volume)
      .div(10 ** 8)
      .toString(),
    trade_timestamp: Math.round(new Date(e.bump_time).getTime() / 1000).toString(),
    type: e.is_sell ? "sell" : "buy",
  }));

  return new Response(stringifyJSON(data), { headers: { "Content-type": "application/json" } });
}
