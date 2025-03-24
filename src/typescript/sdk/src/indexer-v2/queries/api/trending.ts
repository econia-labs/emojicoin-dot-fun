import { AccountAddress } from "@aptos-labs/ts-sdk";

import { DECIMALS } from "../../../const"; /* eslint-disable-line */
import { calculateCirculatingSupply, calculateCurvePrice } from "../../../markets";
import { toReserves } from "../../../types";
import { deserializeToHexString, toNominal } from "../../../utils";
import { type DatabaseJsonType, toPriceFeedData } from "../../types";

export type TrendingMarket = ReturnType<typeof toTrendingMarket>;
export type TrendingMarketArgs = DatabaseJsonType["price_feed"] & { apt_price?: number };

const coin = (v: string) => toNominal(BigInt(v));

/**
 * Converts data from the `price_feed` view into a `TrendingMarket` for the trending markets
 * API route.
 *
 * If you pass `apt_price` to this function, it will calculate USD values for relevant fields.
 *
 * @param data a price feed query JSON response, possibly with `apt_price` included.
 * @returns a JSON response of price feed and market data, intended to be consumed as a
 * public API.
 *
 * See {@link [/api/trending](../../../../../frontend/src/app/api/trending/route.ts)} for more
 * details.
 */
export const toTrendingMarket = (data: TrendingMarketArgs) => {
  const priceFeedData = toPriceFeedData(data);
  const market_cap_apt = coin(data.instantaneous_stats_market_cap);
  const calculationArgs = {
    inBondingCurve: data.in_bonding_curve,
    clammVirtualReserves: toReserves({
      base: data.clamm_virtual_reserves_base,
      quote: data.clamm_virtual_reserves_quote,
    }),
    cpammRealReserves: toReserves({
      base: data.cpamm_real_reserves_base,
      quote: data.cpamm_real_reserves_quote,
    }),
  };
  const circulatingSupply = calculateCirculatingSupply(calculationArgs).toString();
  const curvePrice = calculateCurvePrice(calculationArgs);
  const timestampAsUTC = `${data.transaction_timestamp}Z`;
  return {
    transaction_version: Number(data.transaction_version),
    sender: AccountAddress.from(data.sender).toString(),
    transaction_timestamp: timestampAsUTC,
    market_id: Number(data.market_id),
    symbol_bytes: deserializeToHexString(data.symbol_bytes),
    symbol_emojis: data.symbol_emojis,
    market_address: AccountAddress.from(data.market_address).toString(),
    theoretical_curve_price: curvePrice.toNumber(),
    market_nonce: Number(data.market_nonce),
    in_bonding_curve: data.in_bonding_curve,
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
      circulating_supply: coin(circulatingSupply),
      total_quote_locked: coin(data.instantaneous_stats_total_quote_locked),
      total_value_locked: coin(data.instantaneous_stats_total_value_locked),
      fully_diluted_value: coin(data.instantaneous_stats_fully_diluted_value),
      market_cap_apt,
      market_cap_usd: data.apt_price ? market_cap_apt * data.apt_price : undefined,
    },
    daily_tvl_lp_growth: Number(Number(data.daily_tvl_per_lp_coin_growth).toPrecision(8)),
    daily_volume_quote: coin(data.daily_volume),
    daily_volume_base: coin(data.daily_base_volume),
    quote_price: priceFeedData.closePrice,
    quote_price_24h_ago: priceFeedData.openPrice,
    quote_price_delta_24h: priceFeedData.deltaPercentage,
    usd_price: data.apt_price ? priceFeedData.closePrice * data.apt_price : undefined,
  };
};
