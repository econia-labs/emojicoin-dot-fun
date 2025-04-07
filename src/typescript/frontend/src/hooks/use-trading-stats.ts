import Big from "big.js";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useMemo } from "react";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { q64ToBig } from "@/sdk/index";

export const useTradingStats = () => {
  const { position } = useCurrentPositionQuery();
  const { market0, market1 } = useCurrentMeleeInfo();

  const res = useMemo(() => {
    if (!position || !market0 || !market1) return null;

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
        currentDeposited: BigInt(deposits.round().toString()),
        locked: BigInt(locked.round().toString()),
        pnl: pnl.toNumber(),
        pnlOctas: BigInt(pnlOctas.round().toString()),
        matchAmount: pos.matchAmount,
      };
    } catch (e) {
      console.warn(e);
      return null;
    }
  }, [position, market0, market1]);

  return (
    res ?? {
      currentDeposited: undefined,
      locked: undefined,
      pnl: undefined,
      pnlOctas: undefined,
      matchAmount: undefined,
    }
  );
};
