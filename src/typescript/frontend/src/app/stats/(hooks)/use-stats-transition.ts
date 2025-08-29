import { useCallback, useTransition } from "react";

import { useStatsPageStore } from "@/store/stats-page/store";

export default function useStatsTransition() {
  const getIsLoading = useStatsPageStore((s) => s.getStableIsLoading);
  const setLoading = useStatsPageStore((s) => s.setLoading);
  const [_isPending, transitionFunction] = useTransition();

  return useCallback(
    (e: React.MouseEvent<HTMLElement> | undefined) => {
      // Disable clicking more while the page is loading- this screws with the UI.
      if (getIsLoading()) {
        e?.stopPropagation();
        e?.preventDefault();
        return;
      }

      setLoading(true);
      transitionFunction(() => {
        setLoading(false);
      });
    },
    [getIsLoading, transitionFunction, setLoading]
  );
}
