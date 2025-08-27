"use client";

import { useStatsPageStore } from "@/store/stats-page/store";

import { DEFAULT_STATS_SORT_BY } from "../(utils)/schema";
import StatsPageComponent from "./StatsPageComponent";

export default function StatsShell({ children }: React.PropsWithChildren) {
  const state = useStatsPageStore((s) => s.inner);

  return (
    // When the page is first loaded there is no state yet, so gate the visual component behind a loading screen if it's
    // not defined yet.
    <>
      <StatsPageComponent
        sort={state?.sort ?? DEFAULT_STATS_SORT_BY}
        maxPageNumber={state?.maxPageNumber ?? 1}
        data={state?.data ?? []}
      />
      {/* Always display `children` so the data writer component mounts. */}
      {children}
    </>
  );
}
