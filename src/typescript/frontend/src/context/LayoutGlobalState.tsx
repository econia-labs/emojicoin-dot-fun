"use client";

import { useEffect } from "react";

import type { ArenaInfoModel } from "@/sdk/index";

import { useEventStore } from "./event-store-context";

/**
 * Although this is not a context provider, it functions as one.
 */
export default function LayoutGlobalState({ arenaInfo }: { arenaInfo: ArenaInfoModel | null }) {
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);

  useEffect(() => {
    if (arenaInfo) {
      loadArenaInfoFromServer(arenaInfo);
    }
  }, [loadArenaInfoFromServer, arenaInfo]);

  return <></>;
}
