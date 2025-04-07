import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type {
  UserPositionResponse,
  UserPositionWithInfo,
} from "@/sdk/indexer-v2/queries/api/user-position/types";
import { toUserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";
import { useArenaActivity } from "@/store/arena/activity/hooks";
import { useCurrentEscrow } from "@/store/arena/escrow/hooks";

/**
 * @returns the position, undefined, or null. undefined means it's fetching, null means there's no
 * connected user.
 */
const useCurrentPositionQueryInternal = () => {
  const accountAddress = useAccountAddress();
  const { meleeInfo } = useCurrentMeleeInfo();

  const {
    data: position,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["fetch-current-position", accountAddress ?? "", meleeInfo?.meleeID.toString()],
    queryFn: async () => {
      if (!accountAddress) return null;

      const baseUrl = `${ROUTES.api.arena.position}/${accountAddress}`;
      const res = await fetch(baseUrl)
        .then((res) => res.text())
        .then(parseJSON<UserPositionResponse>)
        .then(toUserPositionWithInfo);

      return res;
    },
    enabled: !!accountAddress,
    // If the position is being re-fetched *not* because the melee didn't changed- continue to
    // use that data. Otherwise, don't use it, because it's invalid.
    placeholderData: (data) => (data && data.meleeID === meleeInfo?.meleeID ? data : null),
    // Refetching is handled by checking the latest user transaction response version below.
    staleTime: Infinity,
  });

  return {
    position,
    refetch,
    isFetching,
    isLoading,
  };
};

export type CurrentUserPosition = UserPositionWithInfo & {
  currentSymbol: string;
  lockedIn: boolean;
};

export const useCurrentPositionQuery = (): {
  position: CurrentUserPosition | null;
  isLoading: boolean;
} => {
  const { meleeInfo } = useCurrentMeleeInfo();
  const { position, isLoading } = useCurrentPositionQueryInternal();
  const escrow = useCurrentEscrow();
  const activity = useArenaActivity(position?.version);

  const resIfNull = { position: null, isLoading };

  if (!meleeInfo) return resIfNull;
  if (meleeInfo.meleeID !== (escrow?.meleeID || position?.meleeID)) resIfNull;

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
    },
    isLoading,
  };
};

function coalescePositionAndEscrow(
  escrow: ReturnType<typeof useCurrentEscrow>,
  position: ReturnType<typeof useCurrentPositionQueryInternal>["position"]
) {
  if (escrow && escrow.version > (position?.version ?? -1n)) {
    return {
      meleeID: escrow.meleeID,
      version: escrow.version,
      user: escrow.user,
      emojicoin0Balance: escrow.emojicoin0,
      emojicoin1Balance: escrow.emojicoin1,
      open: escrow.open,
      lockedIn: escrow.lockedIn,
    };
  }
  if (!position) {
    return null;
  }
  return {
    meleeID: position.meleeID,
    version: position.version,
    user: position.user,
    emojicoin0Balance: position.emojicoin0Balance,
    emojicoin1Balance: position.emojicoin1Balance,
    open: position.open,
    lockedIn: position.matchAmount > 0n,
  };
}
