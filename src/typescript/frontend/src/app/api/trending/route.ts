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
 *     "market_id": 413,
 *     "symbol_bytes": "0xf09fa7a7",
 *     "symbol_emojis": ["🧧"],
 *     "market_address": "0x6b0debd0d80e34b073b1de5f8bfe27983dd604497ac457fb082844894a3e548d",
 *     "theoretical_curve_price": 0.03549040905972445,
 *     "market_nonce": 26386,
 *     "in_bonding_curve": false,
 *     "clamm_virtual_reserves": {
 *       "base": 0,
 *       "quote": 0
 *     },
 *     "cpamm_real_reserves": {
 *       "base": 558793.14425783,
 *       "quote": 19831.79726948
 *     },
 *     "cumulative_stats": {
 *       "base_volume": 102729004.71052358,
 *       "quote_volume": 515981.96931268,
 *       "integrator_fees": 5097.70502162,
 *       "pool_fees_base": 76893.22065444,
 *       "pool_fees_quote": 626.29825998,
 *       "n_swaps": 25511,
 *       "n_chat_messages": 840
 *     },
 *     "instantaneous_stats": {
 *       "circulating_supply": 44441206.85574217,
 *       "total_quote_locked": 19831.79726948,
 *       "total_value_locked": 39663.59453896,
 *       "fully_diluted_value": 1597068.4076876,
 *       "market_cap_apt": 1577236.61041812,
 *       "market_cap_usd": 9086302.388957748
 *     },
 *     "daily_tvl_lp_growth": 1.0004915,
 *     "daily_volume_quote": 3825.62539183,
 *     "daily_volume_base": 101609.09655166,
 *     "quote_price": 0.03557685205345566,
 *     "quote_price_24h_ago": 0.04263140726110441,
 *     "quote_price_delta_24h": -16.547788733413714,
 *     "usd_price": 0.20495468699475275
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
