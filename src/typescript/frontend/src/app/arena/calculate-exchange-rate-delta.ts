import { MarketStateModel, q64ToBig } from "@/sdk/index";
import { ArenaJsonTypes } from "@/sdk/types/arena-json-types";
import Big from "big.js";

/**
 * Calculates the exchange rate data based on the rates at the start of the melee and the
 * current market state.
 */
export default function calculateExchangeRateDelta(
  start: ArenaJsonTypes["ExchangeRate"],
  current: MarketStateModel
) {
  const startRatio = Big(start.quote).div(start.base);
  const currentRatio = q64ToBig(current.lastSwap.avgExecutionPriceQ64);
  const deltaPercentage = startRatio.div(currentRatio).mul(100).sub(100).toNumber();
  return deltaPercentage;
}
