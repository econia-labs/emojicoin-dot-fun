/* eslint-disable import/no-unused-modules */
import Big from "big.js";

import type { ArenaTypes } from "../../../types/arena-types";

export type PositionDiff = {
  user: `0x${string}`;
  meleeID: bigint;
  deposits: bigint;
  withdrawals: bigint;
  matchAmount: bigint;
  version: bigint;
  lastExit0: boolean | null;
};

export const diffFromEnter = (enter: ArenaTypes["ArenaEnterEvent"]): PositionDiff => ({
  user: enter.user,
  meleeID: enter.meleeID,
  deposits: enter.inputAmount,
  withdrawals: 0n,
  matchAmount: enter.matchAmount,
  version: BigInt(enter.version),
  lastExit0: null,
});

export const diffFromExit = (exit: ArenaTypes["ArenaExitEvent"]): PositionDiff => ({
  user: exit.user,
  meleeID: exit.meleeID,
  deposits: 0n,
  withdrawals: calculateWithdrawals(exit),
  matchAmount: -exit.tapOutFee,
  version: BigInt(exit.version),
  lastExit0: exit.emojicoin1Proceeds === 0n,
});

export const diffFromSwap = (swap: ArenaTypes["ArenaSwapEvent"]): PositionDiff => ({
  user: swap.user,
  meleeID: swap.meleeID,
  deposits: 0n,
  withdrawals: 0n,
  matchAmount: 0n,
  version: BigInt(swap.version),
  lastExit0: null,
});

function calculateWithdrawals({
  emojicoin0Proceeds,
  emojicoin0ExchangeRateBase,
  emojicoin0ExchangeRateQuote,
  emojicoin1Proceeds,
  emojicoin1ExchangeRateBase,
  emojicoin1ExchangeRateQuote,
}: ArenaTypes["ArenaExitEvent"]) {
  const [proceeds0, baseRate0, quoteRate0, proceeds1, baseRate1, quoteRate1] = [
    emojicoin0Proceeds,
    emojicoin0ExchangeRateBase,
    emojicoin0ExchangeRateQuote,
    emojicoin1Proceeds,
    emojicoin1ExchangeRateBase,
    emojicoin1ExchangeRateQuote,
  ].map((v) => Big(v.toString()));

  const withdrawals0 = proceeds0.div(baseRate0).mul(quoteRate0);
  const withdrawals1 = proceeds1.div(baseRate1).mul(quoteRate1);
  return BigInt(withdrawals0.plus(withdrawals1).round(0).toString());
}
