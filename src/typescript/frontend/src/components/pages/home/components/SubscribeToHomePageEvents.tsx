"use client";

import { useEventStore } from "context/event-store-context";
import FEATURE_FLAGS from "lib/feature-flags";
import { useResyncArenaInfoQuery } from "lib/hooks/queries/arena/use-arena-info-query";
import { useEffect } from "react";

import useLatestMeleeData from "@/hooks/use-latest-melee-event";
import { useReliableSubscribe } from "@/hooks/use-reliable-subscribe";
import type { ArenaInfoModel } from "@/sdk/indexer-v2";

export const SubscribeToHomePageEvents = ({ info }: { info?: ArenaInfoModel }) => {
  const { latestMeleeEvent } = useLatestMeleeData();
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const currentMeleeID = useEventStore((s) => s.arenaInfoFromServer?.meleeID ?? -1n);
  const { resync } = useResyncArenaInfoQuery();

  useEffect(() => {
    if (FEATURE_FLAGS.Arena && info) {
      loadArenaInfoFromServer(info);
    }
  }, [loadArenaInfoFromServer, info]);

  useReliableSubscribe({
    arena: FEATURE_FLAGS.Arena,
    eventTypes: ["MarketLatestState"],
  });

  useEffect(() => {
    // Make sure this logic matches what's in `use-sync-latest-arena-info`. This one just doesn't refetch positions.
    if (latestMeleeEvent && latestMeleeEvent.melee.meleeID > currentMeleeID) {
      resync();
    }
  }, [latestMeleeEvent, currentMeleeID, resync]);

  return <></>;
};
