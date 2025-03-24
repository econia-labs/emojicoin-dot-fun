"use client";

import { useEventStore } from "context/event-store-context";
import FEATURE_FLAGS from "lib/feature-flags";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLatestMeleeID } from "@/hooks/use-latest-melee-id";
import { useReliableSubscribe } from "@/hooks/use-reliable-subscribe";
import type { ArenaInfoModel } from "@/sdk/indexer-v2";

export const SubscribeToHomePageEvents = ({ info }: { info?: ArenaInfoModel }) => {
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const router = useRouter();

  useEffect(() => {
    if (FEATURE_FLAGS.Arena && info) {
      loadArenaInfoFromServer(info);
    }
  }, [loadArenaInfoFromServer, info]);

  useReliableSubscribe({
    arena: FEATURE_FLAGS.Arena,
    eventTypes: ["MarketLatestState"],
  });

  const latestMeleeID = useLatestMeleeID();
  const currentMelee = useEventStore((s) => s.arenaInfoFromServer);

  useEffect(() => {
    if (currentMelee) {
      if (latestMeleeID > currentMelee.meleeID) {
        router.refresh();
      }
    }
  }, [latestMeleeID, currentMelee, router]);

  return <></>;
};
