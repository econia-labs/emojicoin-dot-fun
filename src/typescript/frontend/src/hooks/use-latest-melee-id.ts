import { useEventStore } from "context/event-store-context";
import { useMemo } from "react";

import { maxBigInt } from "@/sdk/index";

export const useLatestMeleeID = () => {
  const meleeEvents = useEventStore((s) => s.meleeEvents);
  const currentMelee = useEventStore((s) => s.arenaInfoFromServer?.meleeID);

  const latest = useMemo(
    () =>
      maxBigInt(
        meleeEvents
          .map(({ melee }) => melee.meleeID)
          .sort()
          .at(-1) ?? -1n,
        currentMelee ?? -1n
      ),
    [meleeEvents, currentMelee]
  );

  return latest;
};
