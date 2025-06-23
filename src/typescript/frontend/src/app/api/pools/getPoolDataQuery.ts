import type { AccountAddress } from "@aptos-labs/ts-sdk";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { stringifyJSON } from "utils";

import { fetchMarkets } from "@/queries/home";
import { fetchUserLiquidityPools } from "@/queries/pools";
import type { OrderBy } from "@/sdk/indexer-v2/const";
import type { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

export async function getPoolData({
  page,
  sortBy,
  orderBy,
  searchEmojis,
  provider,
}: {
  page: number;
  sortBy: SortMarketsBy;
  orderBy?: OrderBy;
  searchEmojis?: string[];
  provider?: AccountAddress;
}) {
  const res = provider
    ? fetchUserLiquidityPools({
        page,
        orderBy: orderBy,
        sortBy,
        provider,
        searchEmojis,
        pageSize: MARKETS_PER_PAGE,
      })
    : fetchMarkets({
        page,
        inBondingCurve: false,
        orderBy: orderBy,
        sortBy,
        searchEmojis,
        pageSize: MARKETS_PER_PAGE,
      });

  return stringifyJSON(await res);
}
