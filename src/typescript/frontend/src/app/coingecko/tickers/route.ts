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

  const { skip, limit } = {
    skip: Number(searchParams.get("skip") ?? 0),
    limit: Number(searchParams.get("limit") ?? 100),
  };

  if (limit > 500) return new Response("Max limit is 500.", { status: 400 });
  if (limit < 1) return new Response("Min limit is 1.", { status: 400 });
  if (skip < 0) return new Response("Min skip is 0.", { status: 400 });

  const markets = await postgrest
    .from(TableName.MarketState)
    .select("market_address, last_swap_avg_execution_price_q64, daily_volume, daily_base_volume")
    .order("market_id")
    .range(skip, skip + limit);

  const data = markets.data?.map((e) => ({
    ticker_id: `${e.market_address}::coin_factory::Emojicoin_0x1::aptos_coin::AptosCoin`,
    base_currency: `${e.market_address}::coin_factory::Emojicoin`,
    target_currency: "0x1::aptos_coin::AptosCoin",
    pool_id: e.market_address,
    last_price: Big(e.last_swap_avg_execution_price_q64).div(Big(2).pow(64)).toString(),
    base_volume: Big(e.daily_volume)
      .div(10 ** 8)
      .toString(),
    target_volume: Big(e.daily_base_volume)
      .div(10 ** 8)
      .toString(),
  }));

  return new Response(stringifyJSON(data), { headers: { "Content-type": "application/json" } });
}
