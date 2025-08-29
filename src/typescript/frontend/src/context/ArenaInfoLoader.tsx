"use client";

import { useEffect } from "react";

import { type DatabaseJsonType, toArenaInfoModel } from "@/sdk/index";

import { useEventStore } from "./event-store-context";

export default function ArenaInfoLoader({
  arenaInfoJson,
}: {
  arenaInfoJson: DatabaseJsonType["arena_info"] | null;
}) {
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);

  useEffect(() => {
    if (arenaInfoJson) {
      try {
        const model = toArenaInfoModel(arenaInfoJson);
        loadArenaInfoFromServer(model);
      } catch (_e) {
        // Swallow the error silently, since this is client-side.
      }
    }
  }, [loadArenaInfoFromServer, arenaInfoJson]);

  return <></>;
}
