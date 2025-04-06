import Big from "big.js";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useMemo } from "react";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { useLatestMeleeID } from "@/hooks/use-latest-melee-id";
import { q64ToBig } from "@/sdk/index";

export const useArenaProfileStats = () => {
  const { position } = useCurrentPositionQuery();
  const { meleeInfo: info, market0, market1 } = useCurrentMeleeInfo();
  const latestMeleeID = useLatestMeleeID();

  const res = useMemo(() => {
    // Return early with `null` or `undefined` if the user has no position.
    // Or undefined if arena state data isn't in the global store yet.
    // Or if the user's latest position isn't for the current melee.
    if (!position) return position;
    if (!info || !market0 || !market1 || latestMeleeID === -1n) return undefined;
    if (info.meleeID !== position.meleeID) return undefined;

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
    const pnl = profits.div(deposits).sub(1).mul(100);
    const pnlOctas = profits.sub(deposits);

    return {
      currentDeposited: position.deposits,
      locked: BigInt(locked.round().toString()),
      pnl: pnl.toNumber(),
      pnlOctas: BigInt(pnlOctas.round().toString()),
    };
  }, [position, info, market0, market1, latestMeleeID]);

  return (
    res ?? {
      currentDeposited: undefined,
      locked: undefined,
      pnl: undefined,
      pnlOctas: undefined,
    }
  );
};
