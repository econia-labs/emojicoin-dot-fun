import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { stringifyJSON } from "utils";

import { fetchMarkets } from "@/queries/home";
import { fetchUserLiquidityPools } from "@/queries/pools";
import { toOrderBy } from "@/sdk/indexer-v2/const";
import type { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

export async function getPoolData(
  page: number,
  sortBy: SortMarketsBy,
  orderBy: "asc" | "desc",
  searchEmojis?: string[],
  provider?: string
) {
  const res = provider
    ? fetchUserLiquidityPools({
        page,
        orderBy: toOrderBy(orderBy),
        sortBy,
        provider,
        searchEmojis,
        pageSize: MARKETS_PER_PAGE,
      })
    : fetchMarkets({
        page,
        inBondingCurve: false,
        orderBy: toOrderBy(orderBy),
        sortBy,
        searchEmojis,
        pageSize: MARKETS_PER_PAGE,
      });

  return stringifyJSON(await res);
}
