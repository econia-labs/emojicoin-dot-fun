import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "context/event-store-context";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { UserPositionResponse } from "@/sdk/indexer-v2/queries/api/user-position/types";
import { toUserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";

/**
 * @returns the position, undefined, or null. undefined means it's fetching, null means there's no
 * connected user.
 */
export const useCurrentPositionQuery = () => {
  const accountAddress = useAccountAddress();
  const meleeIDFromServer = useEventStore((s) => s.arenaInfoFromServer?.meleeID.toString());

  const {
    data: position,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["fetch-current-position", accountAddress ?? "", meleeIDFromServer ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;

      const baseUrl = `${ROUTES.api.arena.position}/${accountAddress}`;
      const res = await fetch(baseUrl)
        .then((res) => res.text())
        .then(parseJSON<UserPositionResponse>)
        .then(toUserPositionWithInfo);

      return res;
    },
    enabled: !!accountAddress,
    staleTime: Infinity,
  });

  return {
    position,
    refetch,
    isFetching,
    isLoading,
  };
};
