"use client";

import { useEventStore } from "context/event-store-context";
import FEATURE_FLAGS from "lib/feature-flags";
import { useResyncArenaInfoQuery } from "lib/hooks/queries/arena/use-arena-info-query";
import { useEffect } from "react";

import useLatestMeleeData from "@/hooks/use-latest-melee-event";
import type { ArenaInfoModel } from "@/sdk/indexer-v2";

export const SubscribeToHomePageEvents = ({ info }: { info?: ArenaInfoModel }) => {
  const { latestMeleeEvent } = useLatestMeleeData();
  const currentMeleeID = useEventStore((s) => s.arenaInfoFromServer?.meleeID ?? -1n);
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const { resync } = useResyncArenaInfoQuery();
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);
  const unsubscribeEvents = useEventStore((s) => s.unsubscribeEvents);

  useEffect(() => {
    if (FEATURE_FLAGS.Arena && info) {
      loadArenaInfoFromServer(info);
    }
  }, [loadArenaInfoFromServer, info]);

  useEffect(() => {
    subscribeEvents(["MarketLatestState"], { arenaBaseEvents: FEATURE_FLAGS.Arena });

    return () => unsubscribeEvents(["MarketLatestState"], { arenaBaseEvents: FEATURE_FLAGS.Arena });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    // Make sure this logic matches what's in `use-sync-latest-arena-info`. This one just doesn't refetch positions.
    if (latestMeleeEvent && latestMeleeEvent.melee.meleeID > currentMeleeID) {
      resync();
    }
  }, [latestMeleeEvent, currentMeleeID, resync]);

  return <></>;
};
