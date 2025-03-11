"use client";

import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type ArenaInfoModel } from "@sdk/indexer-v2";
import { useEventStore } from "context/event-store-context";
import { useEffect } from "react";

export const SubscribeToHomePageEvents = ({ info }: { info?: ArenaInfoModel }) => {
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  useEffect(() => {
    if (info) {
      loadArenaInfoFromServer(info);
    }
  }, [loadArenaInfoFromServer, info]);

  useReliableSubscribe({
    arena: true,
    eventTypes: ["MarketLatestState"],
  });

  return <></>;
};
