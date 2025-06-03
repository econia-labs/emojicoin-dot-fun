import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

import { AddFavorite, RemoveFavorite } from "@/move-modules";
import type { SymbolEmojiData } from "@/sdk/index";
import { encodeEmojis } from "@/sdk/index";

import { useTransactionBuilder } from "./use-transaction-builder";

export const useFavoriteTransactionBuilder = (emojis: SymbolEmojiData[], isAdd: boolean) => {
  const { account } = useAptos();

  const memoizedArgs = useMemo(() => {
    if (!account) {
      return null;
    }
    return {
      user: account.address,
      symbolBytes: encodeEmojis(emojis),
    };
  }, [account, emojis]);

  return useTransactionBuilder(memoizedArgs, isAdd ? AddFavorite : RemoveFavorite);
};
