import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

import { Exit } from "@/move-modules/emojicoin-arena";
import { toArenaCoinTypes } from "@/sdk/utils/arena/helpers";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useExitTransactionBuilder = (
  market0Address: `0x${string}`,
  market1Address: `0x${string}`
) => {
  const { account } = useAptos();
  const accountAddress = account?.address;
  const memoizedArgs = useMemo(() => {
    if (!accountAddress) {
      return null;
    }
    return {
      participant: accountAddress,
      typeTags: toArenaCoinTypes({ market0Address, market1Address }),
    };
  }, [accountAddress, market0Address, market1Address]);

  return useTransactionBuilder(memoizedArgs, Exit);
};
