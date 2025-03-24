// Disable to allow for doc-comment links and sorted imports.
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AccountAddress } from "@aptos-labs/ts-sdk";
import { getAptPrice } from "lib/queries/get-apt-price";
import { fetchCachedPriceFeed, type NUM_MARKETS_ON_PRICE_FEED } from "lib/queries/price-feed";
import { NextResponse } from "next/server";

import type { DECIMALS } from "@/sdk/const";
import {
  toTrendingMarket,
  type TrendingMarket,
  type TrendingMarketArgs,
} from "@/sdk/indexer-v2/queries";
import type { q64ToBig } from "@/sdk/utils";
/* eslint-enable @typescript-eslint/no-unused-vars */

export const revalidate = 10;

/**
 * ### /api/trending
 *
 * The GET endpoint with no query params for retrieving the top {@link NUM_MARKETS_ON_PRICE_FEED}
 * trending markets.
 *
 * Prices are expressed in terms of the base asset being the emojicoin.
 *   - `"quote_price": 0.0123` indicates `1` emojicoin is worth  `0.0123` APT.
 *   - `"usd_price": 0.20` indicates `1` emojicoin is worth `0.20 USD`.
 *
 * #### NOTE: `market_cap_usd` and `usd_price` may be absent if APT/USD isn't fetched successfully.
 *
 * All q64 values in the contract are normalized to decimalized values with {@link q64ToBig}
 *
 * All APT and emojicoin values are converted to their decimalized formats; that is, they are
 * divided by 10 ^ {@link DECIMALS}.
 *
 * All addresses are AIP-40 compliant. See `.toString()` in {@link AccountAddress}.
 *
 * `base` always refers to the emojicoin.
 *
 * `quote` always refers to APT.
 *
 * `theoretical_curve_price` is the exact current quote price on the curve— it doesn't mean the
 * price ever actually traded there. In other words, if a user traded an infinitesimally small
 * amount, that's the price they would get quoted at.
 *
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
 *       "market_cap_usd": 9086302.388957748 // possibly undefined
 *     },
 *     "daily_tvl_lp_growth": 1.0004915,
 *     "daily_volume_quote": 3825.62539183,
 *     "daily_volume_base": 101609.09655166,
 *     "quote_price": 0.03557685205345566,
 *     "quote_price_24h_ago": 0.04263140726110441,
 *     "quote_price_delta_24h": -16.547788733413714,
 *     "usd_price": 0.20495468699475275 // possibly undefined
 *   }
 * ]
 * ```
 */
export async function GET(_request: Request) {
  try {
    const aptPrice = await getAptPrice();
    const priceFeed = await fetchCachedPriceFeed();
    const res = priceFeed.map((mkt) => {
      (mkt as TrendingMarketArgs)["apt_price"] = aptPrice;
      return toTrendingMarket(mkt);
    });

    return NextResponse.json<TrendingMarket[]>(res);
  } catch (error) {
    console.error("Failed to fetch trending markets:", error);

    return NextResponse.json({ error: "Failed to fetch trending markets." }, { status: 500 });
  }
}
