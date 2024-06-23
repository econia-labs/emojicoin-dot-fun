import { toMarketView } from "@sdk-types";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptos } from "lib/utils/aptos-client";

export const fetchContractMarketView = async (marketAddress: `0x${string}`) => {
  const aptos = getAptos();
  const res = await MarketView.view({
    aptos,
    marketAddress,
  });

  return toMarketView(res);
};
