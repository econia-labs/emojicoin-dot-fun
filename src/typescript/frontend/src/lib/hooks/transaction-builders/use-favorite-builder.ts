import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

import { AddFavorite, RemoveFavorite } from "@/move-modules";

import { useTransactionBuilder } from "./use-transaction-builder";

export const useFavoriteTransactionBuilder = (marketAddress: `0x${string}`, isAdd: boolean) => {
  const { account } = useAptos();

  const memoizedArgs = useMemo(() => {
    if (!account) {
      return null;
    }
    return {
      user: account.address,
      market: marketAddress,
    };
  }, [account, marketAddress]);

  return useTransactionBuilder(memoizedArgs, isAdd ? AddFavorite : RemoveFavorite);
};
