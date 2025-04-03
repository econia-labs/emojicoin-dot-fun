import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import type { DatabaseJsonType } from "@/sdk/index";
import { maxBigInt, toArenaLeaderboardHistoryWithArenaInfo } from "@/sdk/index";
import { useUserTransactionStore } from "@/store/transaction/store";

export const useHistoricalPositionsQuery = (accountAddress?: `0x${string}`) => {
  const latestUserTxnResponse = useUserTransactionStore((s) => s.latestResponse);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["fetch-historical-positions", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      const historicalPositions = await fetch(
        `${ROUTES.api.arena["historical-positions"]}/${accountAddress}`
      )
        .then((res) => res.text())
        .then(parseJSON<DatabaseJsonType["arena_leaderboard_history_with_arena_info"][]>)
        .then((res) => res.map(toArenaLeaderboardHistoryWithArenaInfo));
      const versions = historicalPositions.flatMap((v) => [
        v.arenaInfoLastTransactionVersion,
        v.leaderboardHistoryLastTransactionVersion,
      ]);
      return {
        historicalPositions,
        maxFetchedVersion: maxBigInt(...versions),
      };
    },
    enabled: !!accountAddress,
    // Refetching is handled by checking the latest user transaction response version below.
    staleTime: Infinity,
  });

  const shouldRefetch = useMemo(() => {
    if (!data || !latestUserTxnResponse) return false;
    const latestVersion = maxBigInt(data.maxFetchedVersion, latestUserTxnResponse.version);
    return latestVersion > data.maxFetchedVersion;
  }, [latestUserTxnResponse, data]);

  useEffect(() => {
    if (shouldRefetch) refetch();
  }, [shouldRefetch, refetch]);

  return {
    historicalPositions: data?.historicalPositions,
    isFetching,
  };
};
