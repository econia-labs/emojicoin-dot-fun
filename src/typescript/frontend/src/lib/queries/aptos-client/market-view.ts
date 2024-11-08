"use server";

import { type AccountAddress } from "@aptos-labs/ts-sdk";
import { toMarketView } from "@sdk-types";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptos } from "lib/utils/aptos-client";

export const fetchContractMarketView = async ({
  marketAddress,
}: {
  marketAddress: AccountAddress;
}) => {
  const aptos = getAptos();
  const res = await MarketView.view({
    aptos,
    marketAddress,
  });

  return toMarketView(res);
};
