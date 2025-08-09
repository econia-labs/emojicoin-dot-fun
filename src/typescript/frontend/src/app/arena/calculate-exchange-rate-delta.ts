import Big from "big.js";

import type { DatabaseJsonType } from "@/sdk/index";
import { q64ToBig } from "@/sdk/index";
import type { ArenaJsonTypes } from "@/sdk/types/arena-json-types";

/**
 * Calculates the exchange rate data based on the rates at the start of the melee and the
 * current market state.
 */
export default function calculateExchangeRateDelta(
  start: ArenaJsonTypes["ExchangeRate"],
  current: DatabaseJsonType["market_state"]
) {
  const startRatio = Big(start.quote).div(start.base);
  const currentRatio = q64ToBig(current.last_swap_avg_execution_price_q64);
  const deltaPercentage = currentRatio.div(startRatio).mul(100).sub(100).toNumber();
  return deltaPercentage;
}
