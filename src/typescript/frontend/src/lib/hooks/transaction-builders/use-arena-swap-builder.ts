import { toCoinTypes } from "@sdk/markets";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilder } from "./use-transaction-builder";
import { Swap } from "@/contract-apis/emojicoin-arena";
import { type TypeTag } from "@aptos-labs/ts-sdk";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useArenaSwapTransactionBuilder = (
  market0Address: `0x${string}`,
  market1Address: `0x${string}`
) => {
  const { account } = useAptos();
  const accountAddress = account?.address;
  const memoizedArgs = useMemo(() => {
    if (!accountAddress) {
      return null;
    }
    const { emojicoin: emojicoin0, emojicoinLP: emojicoinLP0 } = toCoinTypes(market0Address);
    const { emojicoin: emojicoin1, emojicoinLP: emojicoinLP1 } = toCoinTypes(market1Address);
    return {
      swapper: accountAddress,
      typeTags: [emojicoin0, emojicoinLP0, emojicoin1, emojicoinLP1] as [
        TypeTag,
        TypeTag,
        TypeTag,
        TypeTag,
      ],
    };
  }, [accountAddress, market0Address, market1Address]);

  return useTransactionBuilder(memoizedArgs, Swap);
};
