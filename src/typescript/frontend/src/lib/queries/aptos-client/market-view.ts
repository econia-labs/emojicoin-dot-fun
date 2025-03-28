"use server";

import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

import { MarketView } from "@/move-modules/emojicoin-dot-fun";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import { toMarketView } from "@/sdk-types";

const fetchContractMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptosClient();
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
