import { NextResponse } from "next/server";
import {
  toTrendingMarket,
  type TrendingMarketArgs,
  type TrendingMarketsResponse,
} from "@sdk/indexer-v2/queries";
import { getAptPrice } from "lib/queries/get-apt-price";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DECIMALS } from "@sdk/const";
import { q64ToBig } from "@sdk/utils";
import { fetchCachedPriceFeed, NUM_MARKETS_ON_PRICE_FEED } from "lib/queries/price-feed";
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Returns the top {@link NUM_MARKETS_ON_PRICE_FEED} markets in the form of a JSON response.
 *
 * NOTES:
 *   - All q64 values are normalized to decimalized values with {@link q64ToBig}
 *   - All APT and emojicoin values are converted to their decimalized formats; that is, they are
 *     divided by 10 ^ {@link DECIMALS}.
 *
 * @returns the top trending markets {@link TrendingMarketsResponse}
 * @example
 * ```json
 * [
 *   {
 *     "market_nonce": 26245,
 *     "market_id": 413,
 *     "symbol_bytes": "0xf09fa7a7",
 *     "symbol_emojis": ["🧧"],
 *     "market_address": "0x6b0debd0d80e34b073b1de5f8bfe27983dd604497ac457fb082844894a3e548d",
 *     "clamm_virtual_reserves": {
 *       "base": 0,
 *       "quote": 0
 *     },
 *     "cpamm_real_reserves": {
 *       "base": 559288.95671031,
 *       "quote": 19814.01809551
 *     },
 *     "cumulative_stats": {
 *       "base_volume": 102726771.2477148,
 *       "quote_volume": 515902.75892755,
 *       "integrator_fees": 5097.5643033,
 *       "pool_fees_base": 76889.80051043,
 *       "pool_fees_quote": 626.22126947,
 *       "n_swaps": 25370,
 *       "n_chat_messages": 840
 *     },
 *     "instantaneous_stats": {
 *       "total_quote_locked": 19814.01809551,
 *       "total_value_locked": 39628.03619102,
 *       "market_cap": 1574408.08051778,
 *       "fully_diluted_value": 1594222.09861329,
 *       "market_cap_usd": 9608140.192975856
 *     },
 *     "daily_tvl_lp_growth": 0.99959452,
 *     "in_bonding_curve": false,
 *     "daily_volume_apt": 4192.15884355,
 *     "daily_volume_emojicoin": 109780.70181239,
 *     "price_current": 0.03533928558048081,
 *     "price_24h_ago": 0.04395169029413305,
 *     "price_delta_24h": -19.595161542175966
 *   }
 * ]
 * ```
 */
export async function GET(_request: Request) {
  try {
    const res = await getAptPrice().then((aptPrice) =>
      fetchCachedPriceFeed().then((res) =>
        res.map((v) => {
          (v as TrendingMarketArgs)["apt_price"] = aptPrice;
          return toTrendingMarket(v);
        })
      )
    );

    return NextResponse.json<TrendingMarketsResponse>(res);
  } catch (error) {
    console.error("Failed to fetch trending markets:", error);

    return new NextResponse("Failed to fetch trending markets.", { status: 500 });
  }
}
