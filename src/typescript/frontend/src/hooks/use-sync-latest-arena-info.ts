import type { ArenaInfoResponse } from "app/api/arena/info/route";
import { useEventStore } from "context/event-store-context";
import { useEffect } from "react";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";

import { toArenaInfoModel, toMarketStateModel } from "@/sdk/index";

import useLatestMeleeData from "./use-latest-melee-event";

export const useSyncLatestArenaInfo = () => {
  const { latestMeleeEvent } = useLatestMeleeData();
  const currentMeleeID = useEventStore((s) => s.arenaInfoFromServer?.meleeID ?? -1n);
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);

  useEffect(() => {
    if (latestMeleeEvent && latestMeleeEvent.melee.meleeID > currentMeleeID) {
      const { version } = latestMeleeEvent.transaction;
      const baseUrl = ROUTES.api.arena.info;
      const url = addSearchParams(baseUrl, { minimumVersion: version.toString() });
      fetch(`${url}`)
        .then((res) => res.text())
        .then(parseJSON<ArenaInfoResponse>)
        .then(({ arena_info, market_0, market_1 }) => ({
          arenaInfo: toArenaInfoModel(arena_info),
          market0: toMarketStateModel(market_0),
          market1: toMarketStateModel(market_1),
        }))
        .then(({ arenaInfo, market0, market1 }) => {
          loadMarketStateFromServer([market0, market1]);
          loadArenaInfoFromServer(arenaInfo);
        });
    }
  }, [latestMeleeEvent, currentMeleeID, loadArenaInfoFromServer, loadMarketStateFromServer]);
};
