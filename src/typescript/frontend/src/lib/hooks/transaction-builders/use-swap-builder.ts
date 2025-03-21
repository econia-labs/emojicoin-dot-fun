import { type AnyNumberString } from "@sdk-types";
import { toCoinTypesForEntry } from "@sdk/markets";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilder } from "./use-transaction-builder";
import { Swap } from "@/contract-apis";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";

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
