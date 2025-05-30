import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { getFavorites } from "lib/queries/get-favorite-markets";
import { useCallback } from "react";

import type { SymbolEmojiData } from "@/sdk/index";
import { encodeEmojis } from "@/sdk/index";

export function useGetFavoriteMarkets() {
  const { account } = useAptos();

  const favoritesQuery = useQuery({
    queryKey: ["useGetFavoriteMarkets", account?.address],
    queryFn: () => (!account?.address ? [] : getFavorites(account.address)),
    select: (data) => new Set(data),
    enabled: !!account,
  });

  // Helper function to check if a market is a favorite.
  const checkIsFavorite = useCallback(
    (data?: SymbolEmojiData[]) => {
      const emojis = data?.map((v) => v.emoji);
      return emojis?.length && favoritesQuery.data?.has(encodeEmojis(emojis));
    },
    [favoritesQuery.data]
  );

  return { favoritesQuery, checkIsFavorite };
}
