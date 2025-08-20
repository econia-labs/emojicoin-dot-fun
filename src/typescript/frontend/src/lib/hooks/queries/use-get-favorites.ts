import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "context/event-store-context";
import { useCallback } from "react";
import { ROUTES } from "router/routes";
import { addSearchParams } from "utils/url-utils";

import { useAccountAddress } from "@/hooks/use-account-address";
import type { DatabaseJsonType, SymbolEmojiData } from "@/sdk/index";
import { encodeEmojis, toMarketStateModel } from "@/sdk/index";

async function getFavoriteMarkets(
  accountAddress: `0x${string}`
): Promise<DatabaseJsonType["market_state"][]> {
  const baseUrl = ROUTES.api.favorites;
  const url = addSearchParams(baseUrl, { accountAddress });
  return fetch(url).then((res) => res.json());
}

export function useFavoriteMarkets() {
  const accountAddress = useAccountAddress();
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);

  const favoritesQuery = useQuery({
    queryKey: ["use-favorite-markets", accountAddress],
    queryFn: () =>
      !accountAddress
        ? { markets: [], favorites: new Set([]) }
        : getFavoriteMarkets(accountAddress)
            .then((res) => res.map(toMarketStateModel))
            .then((res) => {
              if (res.length) loadMarketStateFromServer(res);
              return res;
            })
            .then((res) => ({
              markets: res,
              favorites: new Set(res.map((v) => v.market.symbolData.hex)),
            })),
    enabled: !!accountAddress,
  });

  // Helper function to check if a market is a favorite.
  const checkIsFavorite = useCallback(
    (data?: SymbolEmojiData[]) => {
      const emojis = data?.map((v) => v.emoji);
      return emojis?.length && favoritesQuery.data?.favorites.has(encodeEmojis(emojis));
    },
    [favoritesQuery.data]
  );

  return { favoritesQuery, checkIsFavorite };
}
