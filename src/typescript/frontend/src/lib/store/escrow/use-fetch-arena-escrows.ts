import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";

import type { UserEscrowJson } from "@/sdk/index";
import { fromUserEscrowJson } from "@/sdk/index";

const THIRTY_SECONDS = 30000;

export const useFetchArenaEscrows = (accountAddress?: `0x${string}`) => {
  const { data } = useQuery({
    queryKey: ["fetch-user-arena-escrows", accountAddress ?? ""],
    queryFn: async () => {
      if (!accountAddress) return null;
      // const res = await fetchUserArenaEscrows(accountAddress);
      const res = await fetch(`${ROUTES.api.arena.escrows}/${accountAddress}`)
        .then((res) => res.text())
        .then(parseJSON<UserEscrowJson[]>)
        .then((res) => res.map(fromUserEscrowJson));
      return res;
    },
    staleTime: THIRTY_SECONDS,
    enabled: !!accountAddress,
  });

  return data;
};
