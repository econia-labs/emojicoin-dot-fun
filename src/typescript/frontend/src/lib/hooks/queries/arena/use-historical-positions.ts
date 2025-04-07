import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { DatabaseJsonType } from "@/sdk/index";
import { compareBigInt, maxBigInt, toArenaLeaderboardHistoryWithArenaInfo } from "@/sdk/index";

/**
 * This doesn't need to refetch because any updates we can derive from on-chain activity.
 * In other words, historical positions can be queried once, and then never again.
 */
export const useHistoricalPositionsQuery = () => {
  const accountAddress = useAccountAddress();

  const { data, isFetching } = useQuery({
    queryKey: ["fetch-historical-positions", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      const historicalPositions = await fetch(
        `${ROUTES.api.arena["historical-positions"]}/${accountAddress}`
      )
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
          return [];
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
    isFetching,
  };
};
