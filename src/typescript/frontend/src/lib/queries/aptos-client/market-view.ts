"use server";

import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

import { MarketView } from "@/move-modules/emojicoin-dot-fun";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import { toMarketView } from "@/sdk-types";

const fetchOnChainMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptosClient();
  const res = await MarketView.view({
    aptos,
    marketAddress,
  });

  return stringifyJSON(toMarketView(res));
};

const cachedOnChainMarketView = unstable_cache(fetchOnChainMarketView, ["fetch-market-view"], {
  revalidate: 10,
  tags: ["fetch-market-view"],
});

export const wrappedCachedOnChainMarketView = async (marketAddress: `0x${string}`) => {
  const cached = await cachedOnChainMarketView(marketAddress);
  return parseJSON<ReturnType<typeof toMarketView>>(cached);
};
