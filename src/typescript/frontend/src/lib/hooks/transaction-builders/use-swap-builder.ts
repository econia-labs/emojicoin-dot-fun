import { toCoinTypesForEntry } from "@sdk/markets";
import { type AnyNumberString } from "@sdk-types";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { useMemo } from "react";

import { Swap } from "@/contract-apis";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useSwapTransactionBuilder = (
  marketAddress: `0x${string}`,
  inputAmount: AnyNumberString,
  isSell: boolean,
  minOutputAmount: AnyNumberString
) => {
  const { account } = useAptos();
  const accountAddress = account?.address;
  const memoizedArgs = useMemo(() => {
    if (!accountAddress) {
      return null;
    }
    return {
      swapper: accountAddress,
      marketAddress,
      inputAmount: BigInt(inputAmount),
      isSell,
      integrator: INTEGRATOR_ADDRESS,
      integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS,
      typeTags: toCoinTypesForEntry(marketAddress),
      minOutputAmount: BigInt(minOutputAmount),
    };
  }, [accountAddress, marketAddress, inputAmount, isSell, minOutputAmount]);

  return useTransactionBuilder(memoizedArgs, Swap);
};
