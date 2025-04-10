import { useEventStore } from "context/event-store-context";
import { useResyncArenaInfoQuery } from "lib/hooks/queries/arena/use-arena-info-query";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position-query";
import { useHistoricalPositionsQuery } from "lib/hooks/queries/arena/use-historical-positions-query";
import { useRouteWithMinimumVersion } from "lib/hooks/queries/arena/use-url-with-min-version";
import { useEffect } from "react";
import { ROUTES } from "router/routes";

import useLatestMeleeData from "./use-latest-melee-event";

export const useSyncLatestArenaInfo = () => {
  const { latestMeleeEvent } = useLatestMeleeData();
  const currentMeleeID = useEventStore((s) => s.arenaInfoFromServer?.meleeID ?? -1n);
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const { refetch: positionRefetch } = useCurrentPositionQuery();
  const { refetch: historicalRefetch } = useHistoricalPositionsQuery();
  const { url } = useRouteWithMinimumVersion(ROUTES.api.arena.info);
  const { resync: resyncArenaInfo } = useResyncArenaInfoQuery();

  useEffect(() => {
    if (latestMeleeEvent && latestMeleeEvent.melee.meleeID > currentMeleeID) {
      positionRefetch();
      historicalRefetch();
      resyncArenaInfo();
    }
  }, [
    url,
    latestMeleeEvent,
    currentMeleeID,
    loadArenaInfoFromServer,
    loadMarketStateFromServer,
    positionRefetch,
    historicalRefetch,
    resyncArenaInfo,
  ]);
};
