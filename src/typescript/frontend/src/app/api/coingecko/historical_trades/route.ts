import Big from "big.js";
import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { type NextRequest, NextResponse } from "next/server";
import { stringifyJSON } from "utils";
import { parseSearchParams } from "utils/url-utils";

import { postgrest } from "@/sdk/indexer-v2/queries/client";
import { TableName } from "@/sdk/indexer-v2/types";

import { GetHistoricalTradesSchema } from "./schema";

/**
 * @see {@link https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit?tab=t.0}
 */
export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const { limit, skip, ticker_id, end_time, start_time, type } = GetHistoricalTradesSchema.parse(
    parseSearchParams(searchParams)
  );

  let query = postgrest
    .from(TableName.SwapEvents)
    .select("market_nonce, avg_execution_price_q64, base_volume, quote_volume, bump_time, is_sell");

  if (ticker_id) query = query.eq("market_address", ticker_id.split("_")[0].split("::")[0]);
  if (type) query = query.eq("is_sell", type === "sell");
  if (start_time) query = query.gte("bump_time", new Date(Number(start_time) * 1000).toISOString());
  if (end_time) query = query.lte("bump_time", new Date(Number(end_time) * 1000).toISOString());
  query = query.range(skip, skip + limit - 1);
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

  return new NextResponse(stringifyJSON(data), { headers: { "Content-type": "application/json" } });
});
