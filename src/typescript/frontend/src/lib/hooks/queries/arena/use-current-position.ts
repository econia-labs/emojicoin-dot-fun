import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { DatabaseJsonType } from "@/sdk/index";
import { maxBigInt, toArenaPositionModel } from "@/sdk/index";
import { useUserTransactionStore } from "@/store/transaction/store";

/**
 * @returns the position, undefined, or null. undefined means it's fetching, null means there's no
 * connected user.
 */
export const useCurrentPositionQuery = () => {
  const accountAddress = useAccountAddress();
  const latestUserTxnResponse = useUserTransactionStore((s) => s.latestResponse);

  const {
    data: position,
    isFetching,
    isLoading,
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
    isLoading,
  };
};
