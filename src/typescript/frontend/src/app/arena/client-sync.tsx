"use client";

import { useEventStore } from "context/event-store-context";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useHistoricalPositions } from "lib/hooks/positions/use-historical-positions";
import { useEffect } from "react";

import { useSyncLatestArenaInfo } from "@/hooks/use-sync-latest-arena-info";
import { useSyncArenaActivity } from "@/store/arena/activity/hooks";
import { useSyncArenaEscrows } from "@/store/arena/escrow/hooks";

export default function ArenaClientSync() {
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);
  const unsubscribeEvents = useEventStore((s) => s.unsubscribeEvents);

  useCurrentPosition();
  useHistoricalPositions();

  useSyncLatestArenaInfo();
  useSyncArenaEscrows();
  useSyncArenaActivity();

  useEffect(() => {
    subscribeEvents(["Chat", "MarketLatestState"], { arenaBaseEvents: true });

    return () => unsubscribeEvents(["Chat", "MarketLatestState"], { arenaBaseEvents: true });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return <></>;
}
