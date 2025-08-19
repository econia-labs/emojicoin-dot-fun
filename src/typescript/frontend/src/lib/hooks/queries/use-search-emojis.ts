import { useQuery } from "@tanstack/react-query";
import type { SearchSchema } from "app/api/search/schema";
import { useEventStore } from "context/event-store-context";
import { useEffect, useMemo } from "react";
import { ROUTES } from "router/routes";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

import type { AnyEmoji, DatabaseJsonType } from "@/sdk/index";
import { encodeEmojis, isSymbolEmoji, toMarketStateModel } from "@/sdk/index";

type PickAndSortBy = Pick<z.infer<typeof SearchSchema>, "page" | "sortBy">;

async function getMarketsFromSearchEmojis({
  page,
  sortBy,
  searchBytes,
}: PickAndSortBy & { searchBytes: `0x${string}` }): Promise<DatabaseJsonType["market_state"][]> {
  const baseUrl = ROUTES.api.search;
  const url = addSearchParams(baseUrl, { page, sortBy, searchBytes });
  return fetch(url).then((res) => res.json());
}

export const useSearchEmojisMarkets = ({
  emojis,
  page,
  sortBy,
  isFavoriteFilterEnabled,
}: PickAndSortBy & { emojis: AnyEmoji[]; isFavoriteFilterEnabled: boolean }) => {
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);

  const sortedAndFiltered = useMemo(() => emojis.filter(isSymbolEmoji).toSorted(), [emojis]);
  const { data } = useQuery({
    queryKey: ["search-emojis", sortedAndFiltered.join(",")],
    queryFn: () =>
      !!sortedAndFiltered.length && !isFavoriteFilterEnabled
        ? getMarketsFromSearchEmojis({
            page,
            sortBy,
            searchBytes: encodeEmojis(sortedAndFiltered),
          })
            .then((res) => res.map(toMarketStateModel))
            .then((res) => {
              if (res.length) loadMarketStateFromServer(res);
              return res;
            })
        : [],
    // Ten minutes.
    staleTime: 60 * 10 * 1000,
    enabled: !!sortedAndFiltered.length && !isFavoriteFilterEnabled,
  });

  return isFavoriteFilterEnabled ? [] : (data ?? []);
};
