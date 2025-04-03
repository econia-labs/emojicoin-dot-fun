import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import type { DatabaseJsonType } from "@/sdk/index";
import { maxBigInt, toArenaPositionModel } from "@/sdk/index";
import { useUserTransactionStore } from "@/store/transaction/store";

export const useCurrentPositionQuery = (accountAddress?: `0x${string}`) => {
  const latestUserTxnResponse = useUserTransactionStore((s) => s.latestResponse);

  const {
    data: position,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["fetch-current-position", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      const res = await fetch(`${ROUTES.api.arena.position}/${accountAddress}`)
        .then((res) => res.text())
        .then(parseJSON<DatabaseJsonType["arena_position"]>)
        .then(toArenaPositionModel);
      return res;
    },
    enabled: !!accountAddress,
    // Refetching is handled by checking the latest user transaction response version below.
    staleTime: Infinity,
  });

  const latestPositionVersion = useMemo(
    () => maxBigInt(latestUserTxnResponse?.version ?? -1n, position?.version ?? -1n),
    [latestUserTxnResponse, position?.version]
  );

  useEffect(() => {
    if (position && latestPositionVersion > position.version) {
      refetch();
    }
  }, [position, latestPositionVersion, refetch]);

  return {
    position,
    isFetching,
  };
};
