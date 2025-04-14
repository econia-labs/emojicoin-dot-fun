import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { DatabaseJsonType, Types } from "@/sdk/index";
import { compareBigInt, maxBigInt, toArenaLeaderboardHistoryWithArenaInfo } from "@/sdk/index";

import { useRouteWithMinimumVersion } from "./use-url-with-min-version";

export const useHistoricalPositionsQuery = () => {
  const accountAddress = useAccountAddress();
  const { url } = useRouteWithMinimumVersion(
    `${ROUTES.api.arena["historical-positions"]}/${accountAddress}`
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["fetch-historical-positions", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      const historicalPositions = await fetch(url)
        .then((res) => res.text())
        .then(parseJSON<DatabaseJsonType["arena_leaderboard_history_with_arena_info"][]>)
        .then((res) =>
          res
            .map(toArenaLeaderboardHistoryWithArenaInfo)
            .sort((a, b) => compareBigInt(a.meleeID, b.meleeID))
            .reverse()
        )
        .catch((e) => {
          console.error(e);
          return [] as Types["ArenaLeaderboardHistoryWithArenaInfo"][];
        });
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
    staleTime: Infinity,
  });

  return {
    history: data?.historicalPositions ?? [],
    refetch,
    isLoading,
    isFetching,
  };
};
