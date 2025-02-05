import { APTOS_COIN_TYPE_TAG } from "@sdk/const";
import { postgrest } from "@sdk/indexer-v2/queries/client";
import { TableName } from "@sdk/indexer-v2/types";
import { toNominalPrice } from "@sdk/utils";
import { toNominal } from "lib/utils/decimals";
import type { NextRequest } from "next/server";
import { stringifyJSON } from "utils";
import { estimateLiquidityInUSD } from "./utils";
import { getAptPrice } from "lib/queries/get-apt-price";

// Since this is a public endpoint, set revalidate to 1 to ensure it can't spam the indexer.
export const revalidate = 1;

/**
 * Query params:
 *  - skip: number, the number of rows to skip at the beginning, default is 0
 *  - limit: number, the max number of rows per query, default is 100, max is 500
 *
 * @see {@link https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit?tab=t.0}
 *
 * @example
 * // The example for a single row, given in the Google doc linked above:
 * ```json
 * "ticker_id": "0x1234::coin_factory::Emojicoin_0x1::aptos_coin::AptosCoin",
 * "base_currency": "0x1234::coin_factory::Emojicoin",
 * "target_currency": "0x1::aptos_coin::AptosCoin",
 * "pool_id": "✨",
 * "last_price":"50.0",
 * "base_volume":"10",
 * "target_volume":"500",
 * "liquidity_in_usd": "100",
 * ```
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
    .select(
      "market_address, symbol_emojis, lp_coin_supply, last_swap_avg_execution_price_q64, daily_volume, daily_base_volume, clamm_virtual_reserves_base, clamm_virtual_reserves_quote, cpamm_real_reserves_base, cpamm_real_reserves_quote"
    )
    .order("market_id")
    .range(skip, skip + limit - 1);

  const APTOS_COIN = APTOS_COIN_TYPE_TAG.toString();

  const aptPrice = await getAptPrice();

  const data = markets.data?.map((e) => ({
    ticker_id: `${e.market_address}::coin_factory::Emojicoin_${APTOS_COIN}`,
    base_currency: `${e.market_address}::coin_factory::Emojicoin`,
    target_currency: APTOS_COIN,
    pool_id: e.symbol_emojis.join(""),
    last_price: toNominalPrice(e.last_swap_avg_execution_price_q64).toString(),
    base_volume: toNominal(BigInt(e.daily_base_volume)).toString(),
    target_volume: toNominal(BigInt(e.daily_volume)).toString(),
    liquidity_in_usd: aptPrice !== undefined ? estimateLiquidityInUSD(e, aptPrice) : undefined,
  }));

  return new Response(stringifyJSON(data), { headers: { "Content-type": "application/json" } });
}
