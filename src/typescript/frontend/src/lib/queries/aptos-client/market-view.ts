"use server";

import { toMarketView } from "@sdk-types";
import { MarketView } from "@/contract-apis/emojicoin-dot-fun";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";
import {MarketView_v2} from "@/contract-apis";

export const fetchContractMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptosClient();
  try{
    const res = await MarketView.view({
      aptos,
      marketAddress,
    });
    return stringifyJSON(toMarketView(res));
  }catch (e:unknown){
    console.log(e,"version 2")
    const res = await MarketView_v2.view({
      aptos,
      marketAddress,
    });
    return stringifyJSON(toMarketView(res));
  }



};

const cachedContractMarketView = unstable_cache(fetchContractMarketView, ["fetch-market-view"], {
  revalidate: 10,
});

export const wrappedCachedContractMarketView = async (marketAddress: `0x${string}`) => {
  const cached = await cachedContractMarketView(marketAddress);
  return parseJSON<ReturnType<typeof toMarketView>>(cached);
};
