import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCallback } from "react";

import { ViewFavorites } from "@/move-modules";
import { getAptosClient } from "@/sdk/utils";

async function getFavorites(address: string) {
  const aptos = getAptosClient();
  return ViewFavorites.view({ aptos, user: address }).then((res) => res);
}

export function useGetFavorites() {
  const { account } = useAptos();

  const favoritesQuery = useQuery({
    queryKey: ["useGetFavorites", account?.address],
    queryFn: () => (!account?.address ? [] : getFavorites(account.address)),
    select: (data) => new Set(data),
    enabled: !!account,
  });

  //Helper function to check if a market is a favorite
  const checkIsFavorite = useCallback(
    (marketAddress: `0x${string}`) =>
      !!favoritesQuery.data && favoritesQuery.data.has(marketAddress),
    [favoritesQuery.data]
  );

  return { favoritesQuery, checkIsFavorite };
}
