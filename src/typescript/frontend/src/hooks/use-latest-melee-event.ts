import { useEventStore } from "context/event-store-context";
import { useMemo } from "react";

import { compareBigInt, maxBigInt } from "@/sdk/index";

export default function useLatestMeleeData() {
  const meleeEvents = useEventStore((s) => s.meleeEvents);
  const meleeInfo = useEventStore((s) => s.arenaInfoFromServer);
  return useMemo(() => {
    const latestMeleeEvent = meleeEvents
      .toSorted(({ melee: a }, { melee: b }) => compareBigInt(a.meleeID, b.meleeID))
      .at(-1);
    const latestMeleeID = maxBigInt(
      meleeInfo?.meleeID ?? -1n,
      latestMeleeEvent?.melee.meleeID ?? -1n
    );
    return {
      latestMeleeEvent,
      latestMeleeID,
    };
  }, [meleeInfo, meleeEvents]);
}
