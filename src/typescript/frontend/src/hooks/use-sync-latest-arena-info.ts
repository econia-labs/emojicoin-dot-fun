import { useEventStore } from "context/event-store-context";
import { useEffect } from "react";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";

import type { DatabaseJsonType } from "@/sdk/index";
import { toArenaInfoModel } from "@/sdk/index";

import useLatestMeleeData from "./use-latest-melee-event";

export const useSyncLatestArenaInfo = () => {
  const { latestMeleeEvent } = useLatestMeleeData();
  const currentMeleeID = useEventStore((s) => s.arenaInfoFromServer?.meleeID ?? -1n);
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);

  useEffect(() => {
    if (latestMeleeEvent && latestMeleeEvent.melee.meleeID > currentMeleeID) {
      const { version } = latestMeleeEvent.transaction;
      const baseUrl = ROUTES.api.arena.info;
      const url = addSearchParams(baseUrl, { minimumVersion: version.toString() });
      fetch(`${url}`)
        .then((res) => res.text())
        .then(parseJSON<DatabaseJsonType["arena_info"]>)
        .then(toArenaInfoModel)
        .then(loadArenaInfoFromServer);
    }
  }, [latestMeleeEvent, currentMeleeID, loadArenaInfoFromServer]);
};
