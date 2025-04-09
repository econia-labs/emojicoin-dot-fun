import { useQuery } from "@tanstack/react-query";
import type { ArenaInfoResponse } from "app/api/arena/info/route";
import { useEventStore } from "context/event-store-context/hooks";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { toArenaInfoModel, toMarketStateModel } from "@/sdk/index";

import { useRouteWithMinimumVersion } from "./use-url-with-min-version";

/**
 * This query only runs when there is a new melee. It should be disabled by default.
 * It's intended to refresh/refetch the arena info data when a new melee begins.
 */
export function useResyncArenaInfoQuery() {
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const { url } = useRouteWithMinimumVersion(ROUTES.api.arena.info);

  const { data, refetch } = useQuery({
    queryKey: ["fetch-new-arena-info"],
    queryFn: () =>
      fetch(url)
        .then((res) => res.text())
        .then(parseJSON<ArenaInfoResponse>)
        .then(({ arena_info, market_0, market_1 }) => ({
          arenaInfo: toArenaInfoModel(arena_info),
          market0: toMarketStateModel(market_0),
          market1: toMarketStateModel(market_1),
        }))
        .then(({ arenaInfo, market0, market1 }) => {
          loadMarketStateFromServer([market0, market1]);
          loadArenaInfoFromServer(arenaInfo);
        }),
    // Only fetch if explicitly instructed to do so with refetch.
    enabled: false,
    staleTime: Infinity,
  });

  return {
    data,
    // Named resync because it refetches and then updates the state immediately with the new data.
    resync: refetch,
  };
}
