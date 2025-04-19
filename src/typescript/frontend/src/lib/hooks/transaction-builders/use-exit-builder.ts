import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { Exit } from "@/move-modules/emojicoin-arena";
import { toArenaCoinTypes } from "@/sdk/utils/arena/helpers";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useExitTransactionBuilder = (
  market0Address?: `0x${string}`,
  market1Address?: `0x${string}`
) => {
  const accountAddress = useAccountAddress();
  const memoizedArgs = useMemo(() => {
    if (!accountAddress || !market0Address || !market1Address) return null;
    return {
      participant: accountAddress,
      typeTags: toArenaCoinTypes({ market0Address, market1Address }),
    };
  }, [accountAddress, market0Address, market1Address]);

  return useTransactionBuilder(memoizedArgs, Exit);
};
