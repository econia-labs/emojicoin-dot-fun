import { useEventStore } from "context/event-store-context";

/**
 * Return the latest market state of the melee markets set in the ArenaInfoModel data.
 * This is the melee data for the arena info data provided upon initial load- not necessarily
 * the newest melee info.
 */
export const useCurrentMeleeInfo = () => {
  const info = useEventStore((s) => s.arenaInfoFromServer);
  const market0 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin0Symbols));
  const market1 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin1Symbols));
  return { meleeInfo: info, market0, market1 };
};
