import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { isUserEscrow } from "@/sdk/index";
import { globalEscrowStore } from "@/store/arena/escrow/store";

import type { CurrentUserPosition } from "./positions/use-current-position";
import { coalescePositionAndEscrow } from "./positions/utils";
import { useCurrentPositionQueryKey } from "./queries/arena/use-current-position-query";

export function useArenaSubmissionSnapshot() {
  const accountAddress = useAccountAddress();
  const queryClient = useQueryClient();
  const queryKey = useCurrentPositionQueryKey(accountAddress);
  const { meleeInfo } = useCurrentMeleeInfo();

  return useMemo(() => {
    if (!accountAddress || !meleeInfo) return undefined;

    // Get the instantaneous current coalesced position/escrow data.
    const escrow = globalEscrowStore
      .getState()
      .addressMap.get(accountAddress)
      ?.get(meleeInfo.meleeID);

    const instantPosition = queryClient.getQueryData(queryKey) as
      | (CurrentUserPosition | null)
      | undefined;

    const [symbol0, symbol1] = [
      meleeInfo.emojicoin0Symbols.join(""),
      meleeInfo.emojicoin1Symbols.join(""),
    ];

    const position = coalescePositionAndEscrow(
      escrow && isUserEscrow(escrow) ? escrow : undefined,
      instantPosition
    );

    if (!position) return undefined;

    const [from, to] = position?.emojicoin0Balance ? [symbol0, symbol1] : [symbol1, symbol0];

    return {
      meleeInfo,
      position,
      from,
      to,
    };
  }, [accountAddress, meleeInfo, queryClient, queryKey]);
}
