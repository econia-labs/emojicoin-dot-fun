import { type AnyNumberString } from "@sdk-types";
import { toCoinTypes } from "@sdk/markets";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilder } from "./use-transaction-builder";
import { Enter } from "@/contract-apis/emojicoin-arena";
import { type TypeTag } from "@aptos-labs/ts-sdk";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useEnterTransactionBuilder = (
  inputAmount: AnyNumberString,
  lockIn: boolean,
  market0Address: `0x${string}`,
  market1Address: `0x${string}`,
  targetMarketAddress: `0x${string}`
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
      entrant: accountAddress,
      inputAmount: BigInt(inputAmount),
      lockIn,
      typeTags: [
        emojicoin0,
        emojicoinLP0,
        emojicoin1,
        emojicoinLP1,
        targetMarketAddress === market0Address ? emojicoin0 : emojicoin1,
      ] as [TypeTag, TypeTag, TypeTag, TypeTag, TypeTag],
    };
  }, [accountAddress, inputAmount, lockIn, market0Address, market1Address, targetMarketAddress]);

  return useTransactionBuilder(memoizedArgs, Enter);
};
