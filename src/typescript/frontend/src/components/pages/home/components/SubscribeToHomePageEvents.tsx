"use client";

import { useEventStore } from "context/event-store-context";
import FEATURE_FLAGS from "lib/feature-flags";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import useLatestMeleeData from "@/hooks/use-latest-melee-event";
import { useReliableSubscribe } from "@/hooks/use-reliable-subscribe";
import type { ArenaInfoModel } from "@/sdk/indexer-v2";

export const SubscribeToHomePageEvents = ({ info }: { info?: ArenaInfoModel }) => {
  const { latestMeleeEvent } = useLatestMeleeData();
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

  const currentMelee = useEventStore((s) => s.arenaInfoFromServer);

  // cpsell fix
  useEffect(() => {
    if (currentMelee) {
      if ((latestMeleeEvent?.melee.meleeID ?? -1n) > currentMelee.meleeID) {
        router.refresh();
      }
    }
  }, [latestMeleeEvent, currentMelee, router]);

  return <></>;
};
