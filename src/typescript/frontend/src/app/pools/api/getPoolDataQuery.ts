import { fetchMarkets } from "@/queries/home";
import { fetchUserLiquidityPools } from "@/queries/pools";
import type { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { toOrderBy } from "@sdk/queries";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";

export async function getPoolData(
  page: number,
  sortBy: SortMarketsBy,
  orderBy: "asc" | "desc",
  searchEmojis?: string[],
  provider?: string
) {
  if (provider) {
    return fetchUserLiquidityPools({
      page,
      orderBy: toOrderBy(orderBy),
      sortBy,
      provider,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
  } else {
    return fetchMarkets({
      page,
      inBondingCurve: false,
      orderBy: toOrderBy(orderBy),
      sortBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
  }
}
