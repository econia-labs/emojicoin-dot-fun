import { useEventStore } from "context/event-store-context";
import { useMemo } from "react";

import { useArenaPhaseStore } from "@/components/pages/arena/phase/store";

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
  const selection = useArenaPhaseStore((s) => s.selectedMarket);

  const { selectedMarket, symbol0, symbol1 } = useMemo(() => {
    return {
      selectedMarket: selection === 0 ? market0 : selection === 1 ? market1 : undefined,
      symbol0: info?.emojicoin0Symbols.join(""),
      symbol1: info?.emojicoin1Symbols.join(""),
    };
  }, [info, market0, market1, selection]);

  return { meleeInfo: info, market0, market1, selectedMarket, symbol0, symbol1 };
};
