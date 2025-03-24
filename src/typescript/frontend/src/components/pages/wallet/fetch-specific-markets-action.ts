"use server";

import type { SymbolEmoji } from "@sdk/emoji_data";
import { fetchSpecificMarkets } from "@sdk/indexer-v2/queries";
import { calculateCurvePrice } from "@sdk/markets";
import { toNominal } from "@sdk/utils";

/**
 * Wrapper to make `fetchSpecificMarkets` into a single server action. Only return the data required
 * to discourage unexpected public usage of this endpoint and keep the response size small.
 *
 * @see {@link fetchSpecificMarkets}
 */
export async function fetchSpecificMarketsAction(symbols: SymbolEmoji[][]) {
  return await fetchSpecificMarkets(symbols).then((markets) =>
    markets.map((market) => {
      const curvePrice = calculateCurvePrice(market.state).toNumber();
      const marketCap = market.state.instantaneousStats.marketCap;
      const { symbol } = market.market.symbolData;
      return {
        symbol,
        nominalCurvePrice: curvePrice,
        nominalMarketCap: toNominal(marketCap),
        inBondingCurve: market.inBondingCurve,
        marketID: market.market.marketID,
      };
    })
  );
}
