import { useEventStore } from "context/event-store-context";
import { useMemo } from "react";

/**
 * Return the latest market state of the melee markets set in the ArenaInfoModel data.
 * This is the melee data for the arena info data provided upon initial load- not necessarily
 * the newest melee info.
 *
 * Also returns the currently selected market based on the current arena phase selection.
 */
export const useCurrentMeleeInfo = () => {
  const info = useEventStore((s) => s.arenaInfoFromServer);
  const market0 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin0Symbols));
  const market1 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin1Symbols));

  // Note this is *not* the market in the escrow- it's what's selected in the UI.
  const { symbol0, symbol1 } = useMemo(() => {
    return {
      symbol0: info?.emojicoin0Symbols.join(""),
      symbol1: info?.emojicoin1Symbols.join(""),
    };
  }, [info]);

  return { meleeInfo: info, market0, market1, symbol0, symbol1 };
};
