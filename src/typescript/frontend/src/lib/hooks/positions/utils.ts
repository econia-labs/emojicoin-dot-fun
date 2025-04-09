import type { useCurrentEscrow } from "@/store/arena/escrow/hooks";

import type { useCurrentPositionQuery } from "../queries/arena/use-current-position-query";

export function coalescePositionAndEscrow(
  escrow: ReturnType<typeof useCurrentEscrow>,
  position: ReturnType<typeof useCurrentPositionQuery>["position"]
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
