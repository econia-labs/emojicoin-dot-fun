"use server";

import { toMarketView } from "@sdk-types";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptos } from "lib/utils/aptos-client";
import { unstable_cache } from "next/cache";

export const fetchContractMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptos();
  const res = await MarketView.view({
    aptos,
    marketAddress,
  });

  return toMarketView(res);
};

export const cachedContractMarketView = unstable_cache(
  fetchContractMarketView,
  ["fetch-market-view"],
  {
    revalidate: 10,
  }
);
