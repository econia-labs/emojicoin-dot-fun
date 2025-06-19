import type { AccountAddress } from "@aptos-labs/ts-sdk";
import { stringifyJSON } from "utils";

import { fetchMarkets } from "@/queries/home";
import { fetchUserLiquidityPools } from "@/queries/pools";
import { LIMIT, type OrderBy } from "@/sdk/indexer-v2/const";
import type { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

export async function getPoolData({
  page,
  sortBy,
  orderBy,
  limit = LIMIT,
  searchEmojis,
  provider,
}: {
  page: number;
  sortBy: SortMarketsBy;
  orderBy?: OrderBy;
  limit?: number;
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
        pageSize: limit,
      })
    : fetchMarkets({
        page,
        inBondingCurve: false,
        orderBy: orderBy,
        sortBy,
        searchEmojis,
        pageSize: limit,
      });

  return stringifyJSON(await res);
}
