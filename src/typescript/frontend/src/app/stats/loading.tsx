"use client";

import { useEffect } from "react";

import { useStatsPageStore } from "@/store/stats-page/store";

export default function Loading() {
  const setLoading = useStatsPageStore((s) => s.setLoading);
  useEffect(() => {
    // On mount, indicate to the inner content that this is loading. It's marked as not loading when the data writer
    // component in `page.tsx` mounts.
    setLoading(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return <></>;
}
