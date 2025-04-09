"use client";

import { useEventStore } from "context/event-store-context";
import { useEffectOnce } from "react-use";

import { useSyncLatestArenaInfo } from "@/hooks/use-sync-latest-arena-info";
import { useSyncArenaActivity } from "@/store/arena/activity/hooks";
import { useSyncArenaEscrows } from "@/store/arena/escrow/hooks";

export default function ArenaClientSync() {
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);

  useSyncLatestArenaInfo();
  useSyncArenaEscrows();
  useSyncArenaActivity();

  useEffectOnce(() => {
    subscribeEvents(["Chat", "MarketLatestState"], { arenaBaseEvents: true });
  });

  return <></>;
}
