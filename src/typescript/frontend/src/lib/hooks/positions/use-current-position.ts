import { useMemo } from "react";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { UserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";
import { useArenaActivity } from "@/store/arena/activity/hooks";
import { useCurrentEscrow } from "@/store/arena/escrow/hooks";

import { useCurrentPositionQuery } from "../queries/arena/use-current-position-query";
import { coalescePositionAndEscrow } from "./utils";

export type CurrentUserPosition = UserPositionWithInfo & {
  currentSymbol: string;
  lockedIn: boolean;
  stale: boolean;
};

export const useCurrentPosition = (): {
  position: CurrentUserPosition | null;
  isLoading: boolean;
} => {
  const { meleeInfo } = useCurrentMeleeInfo();
  const { position, isLoading } = useCurrentPositionQuery();
  const escrow = useCurrentEscrow();
  const activity = useArenaActivity();

  return useMemo(() => {
    const resIfNull = { position: null, isLoading };
    if (!meleeInfo) return resIfNull;
    if (meleeInfo.meleeID !== (escrow?.meleeID || position?.meleeID)) return resIfNull;

    const coalesced = coalescePositionAndEscrow(escrow, position);
    if (!coalesced) return resIfNull;

    return {
      position: {
        ...coalesced,
        withdrawals: (position?.withdrawals ?? 0n) + (activity?.withdrawals ?? 0n),
        deposits: (position?.deposits ?? 0n) + (activity?.deposits ?? 0n),
        lastExit0: activity?.lastExit0 ?? null,
        matchAmount: (position?.matchAmount ?? 0n) + (activity?.matchAmount ?? 0n),
        emojicoin0MarketID: meleeInfo.emojicoin0MarketID,
        emojicoin1MarketID: meleeInfo.emojicoin1MarketID,
        emojicoin0Symbols: meleeInfo.emojicoin0Symbols,
        emojicoin1Symbols: meleeInfo.emojicoin1Symbols,
        currentSymbol: (coalesced.emojicoin0Balance
          ? meleeInfo.emojicoin0Symbols
          : meleeInfo.emojicoin1Symbols
        ).join(""),
        stale: coalesced.meleeID < meleeInfo.meleeID,
      },
      isLoading,
    };
  }, [activity, escrow, isLoading, meleeInfo, position]);
};
