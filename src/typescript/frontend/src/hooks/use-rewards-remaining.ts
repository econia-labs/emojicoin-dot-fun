import { useEventStore } from "context/event-store-context/hooks";
import { useMemo } from "react";

import { minBigInt } from "@/sdk/index";

export default function useRewardsRemaining() {
  const arenaInfo = useEventStore((s) => s.arenaInfoFromServer);
  const vaultBalance = useEventStore((s) => s.vaultBalance);

  return useMemo(() => {
    if (!arenaInfo) return 0n;
    if (!vaultBalance) return arenaInfo.rewardsRemaining;
    return minBigInt(arenaInfo.rewardsRemaining, vaultBalance);
  }, [arenaInfo, vaultBalance]);
}
