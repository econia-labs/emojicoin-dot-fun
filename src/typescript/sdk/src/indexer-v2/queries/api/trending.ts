import { deserializeToHexString, toNominal } from "../../../utils";
import { type DatabaseJsonType, toPriceFeedData } from "../../types";
import { DECIMALS } from "../../../const"; /* eslint-disable-line */

export type TrendingMarketsResponse = TrendingMarket[];
export type TrendingMarket = ReturnType<typeof toTrendingMarket>;
export type TrendingMarketArgs = DatabaseJsonType["price_feed"] & { apt_price?: number };

const coin = (v: string) => toNominal(BigInt(v));

/**
 * Converts data from the `price_feed` view into a `TrendingMarket` for the trending markets
 * API route.
 *
 * NOTE: All fields in this response that represent coin values are converted to their nominal
 * value form. That is, they are divided by 10 ^ {@link DECIMALS}.
 *
 * @param data
 * @returns a JSON response of price feed and market data, intended to be consumed as a
 * public API.
 *
 */
export const toTrendingMarket = (data: TrendingMarketArgs) => {
  const priceFeedData = toPriceFeedData(data);
  const market_cap = coin(data.instantaneous_stats_market_cap);
  return {
    market_nonce: Number(data.market_nonce),
    market_id: Number(data.market_id),
    symbol_bytes: deserializeToHexString(data.symbol_bytes),
    symbol_emojis: data.symbol_emojis,
    market_address: data.market_address,
    clamm_virtual_reserves: {
      base: coin(data.clamm_virtual_reserves_base),
      quote: coin(data.clamm_virtual_reserves_quote),
    },
    cpamm_real_reserves: {
      base: coin(data.cpamm_real_reserves_base),
      quote: coin(data.cpamm_real_reserves_quote),
    },
    cumulative_stats: {
      base_volume: coin(data.cumulative_stats_base_volume),
      quote_volume: coin(data.cumulative_stats_quote_volume),
      integrator_fees: coin(data.cumulative_stats_integrator_fees),
      pool_fees_base: coin(data.cumulative_stats_pool_fees_base),
      pool_fees_quote: coin(data.cumulative_stats_pool_fees_quote),
      n_swaps: Number(data.cumulative_stats_n_swaps),
      n_chat_messages: Number(data.cumulative_stats_n_chat_messages),
    },
    instantaneous_stats: {
      total_quote_locked: coin(data.instantaneous_stats_total_quote_locked),
      total_value_locked: coin(data.instantaneous_stats_total_value_locked),
      market_cap,
      fully_diluted_value: coin(data.instantaneous_stats_fully_diluted_value),
      market_cap_usd: data.apt_price ? market_cap * data.apt_price : undefined,
    },
    daily_tvl_lp_growth: Number(Number(data.daily_tvl_per_lp_coin_growth).toPrecision(8)),
    in_bonding_curve: data.in_bonding_curve,
    daily_volume_apt: coin(data.daily_volume),
    daily_volume_emojicoin: coin(data.daily_base_volume),
    price_current: priceFeedData.closePrice,
    price_24h_ago: priceFeedData.openPrice,
    price_delta_24h: priceFeedData.deltaPercentage,
  };
};
