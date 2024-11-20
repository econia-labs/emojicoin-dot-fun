"use server";

import { toMarketView } from "@sdk-types";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptos } from "lib/utils/aptos-client";
import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

export const fetchContractMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptos();
  const res = await MarketView.view({
    aptos,
    marketAddress,
  });

  return stringifyJSON(toMarketView(res));
};

const cachedContractMarketView = unstable_cache(fetchContractMarketView, ["fetch-market-view"], {
  revalidate: 10,
});

export const wrappedCachedContractMarketView = async (marketAddress: `0x${string}`) => {
  const cached = await cachedContractMarketView(marketAddress);
  return parseJSON<ReturnType<typeof toMarketView>>(cached);
};
