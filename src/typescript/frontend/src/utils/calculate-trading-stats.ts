import Big from "big.js";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";

import type { MarketLatestStateEventModel } from "@/sdk/index";
import { q64ToBig } from "@/sdk/index";

export function calculateTradingStats(
  position: CurrentUserPosition,
  market0: MarketLatestStateEventModel,
  market1: MarketLatestStateEventModel
) {
  try {
    // Get balances, deposits, and withdrawals from the current position.
    const pos = position;
    const [balance0, balance1, deposits, withdrawals] = [
      pos.emojicoin0Balance,
      pos.emojicoin1Balance,
      pos.deposits,
      pos.withdrawals,
    ].map((v) => Big(v.toString()));

    // Convert the current market states last prices to non-q64 prices.
    const [price0, price1] = [
      q64ToBig(market0.lastSwap.avgExecutionPriceQ64),
      q64ToBig(market1.lastSwap.avgExecutionPriceQ64),
    ];

    // Calculate things.
    const locked = price0.mul(balance0).add(price1.mul(balance1));
    const profits = locked.plus(withdrawals);
    if (deposits.eq(0) && !profits.eq(0)) {
      console.warn("Avoiding a divide by zero error, returning null.");
      return null;
    }
    const pnl = profits.div(deposits).sub(1).mul(100);
    const pnlOctas = profits.sub(deposits);

    return {
      deposits: BigInt(deposits.round().toString()),
      locked: BigInt(locked.round().toString()),
      profits: BigInt(profits.round().toString()),
      pnl: pnl.toNumber(),
      pnlOctas: BigInt(pnlOctas.round().toString()),
      matchAmount: pos.matchAmount,
    };
  } catch (e) {
    console.warn(e);
    return null;
  }
}
