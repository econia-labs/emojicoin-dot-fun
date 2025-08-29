"use client";

import { useEffectOnce } from "react-use";

import { useStatsPageStore } from "@/store/stats-page/store";

import type { StatsPageData } from "../(utils)/fetches";

export default function DataWriter(stats: StatsPageData) {
  const setStats = useStatsPageStore((s) => s.update);
  const setLoading = useStatsPageStore((s) => s.setLoading);

  useEffectOnce(() => {
    // Mark this as no longer loading to the inner content- this undoes the marked loading state from `loading.tsx`.
    setLoading(false);
    setStats(stats);
  });

  return <></>;
}
