import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useMemo } from "react";
import { calculateTradingStats } from "utils/calculate-trading-stats";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";

export const useTradingStats = () => {
  const { position } = useCurrentPosition();
  const { market0, market1 } = useCurrentMeleeInfo();

  const res = useMemo(() => {
    if (!position || !market0 || !market1) return null;
    return calculateTradingStats(position, market0, market1);
  }, [position, market0, market1]);

  return (
    res ?? {
      deposits: undefined,
      locked: undefined,
      profits: undefined,
      pnl: undefined,
      pnlOctas: undefined,
      matchAmount: undefined,
    }
  );
};
