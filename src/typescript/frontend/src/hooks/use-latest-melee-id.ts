import { useEventStore } from "context/event-store-context";
import { useMemo } from "react";

export const useLatestMeleeID = () => {
  const melees = useEventStore((s) => s.meleeEvents);

  const latest = useMemo(
    () =>
      melees
        .map(({ melee }) => melee.meleeID)
        .sort()
        .at(-1) ?? -1n,
    [melees]
  );

  return latest;
};
