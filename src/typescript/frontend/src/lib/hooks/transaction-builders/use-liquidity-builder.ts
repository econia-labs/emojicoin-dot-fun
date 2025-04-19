import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { ProvideLiquidity, RemoveLiquidity } from "@/move-modules";
import { toEmojicoinTypesForEntry } from "@/sdk/markets";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useLiquidityTransactionBuilder = (
  marketAddress: string | undefined,
  direction: "add" | "remove",
  quoteAmount: bigint,
  lpCoinAmount: bigint,
  minLpCoinsOut: bigint = 1n,
  minQuoteOut: bigint = 1n
) => {
  const accountAddress = useAccountAddress();

  const { memoizedArgs, ProvideOrRemove } = useMemo(() => {
    const ProvideOrRemove = direction === "add" ? ProvideLiquidity : RemoveLiquidity;
    if (!accountAddress || !marketAddress) {
      return {
        memoizedArgs: null,
        ProvideOrRemove,
      };
    }
    const sharedArgs = {
      provider: accountAddress,
      marketAddress,
      typeTags: toEmojicoinTypesForEntry(marketAddress),
    };
    const otherArgs =
      direction === "add"
        ? {
            quoteAmount,
            minLpCoinsOut,
          }
        : {
            lpCoinAmount,
            minQuoteOut,
          };
    return {
      ProvideOrRemove,
      memoizedArgs: {
        ...sharedArgs,
        ...otherArgs,
      },
    };
  }, [
    accountAddress,
    direction,
    lpCoinAmount,
    marketAddress,
    minLpCoinsOut,
    minQuoteOut,
    quoteAmount,
  ]);

  return useTransactionBuilder(memoizedArgs, ProvideOrRemove);
};
