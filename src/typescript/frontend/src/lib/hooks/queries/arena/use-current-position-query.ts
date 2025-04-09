import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { UserPositionResponse } from "@/sdk/indexer-v2/queries/api/user-position/types";
import { toUserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";

import { useRouteWithMinimumVersion } from "./use-url-with-min-version";

/**
 * @returns the position, undefined, or null. undefined means it's fetching, null means there's no
 * connected user.
 */
export const useCurrentPositionQuery = () => {
  const accountAddress = useAccountAddress();
  const { url, minimumVersion } = useRouteWithMinimumVersion(
    `${ROUTES.api.arena.position}/${accountAddress}`
  );

  const {
    data: position,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["fetch-current-position", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      const res = await fetch(url)
        .then((res) => res.text())
        .then(parseJSON<UserPositionResponse>)
        .then(toUserPositionWithInfo);
      return res;
    },
    enabled: !!accountAddress,
    placeholderData: (data) =>
      data && minimumVersion && data.meleeID === BigInt(minimumVersion) ? data : null,
    staleTime: Infinity,
  });

  return {
    position,
    refetch,
    isFetching,
    isLoading,
  };
};
