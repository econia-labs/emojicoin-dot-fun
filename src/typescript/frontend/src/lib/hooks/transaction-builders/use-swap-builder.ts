import { INTEGRATOR_ADDRESS } from "lib/env";
import getDynamicBaseFeeRateBPs from "lib/utils/get-dynamic-base-fee-rate";
import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { Swap } from "@/move-modules";
import { toEmojicoinTypesForEntry } from "@/sdk/markets";
import type { AnyNumberString } from "@/sdk-types";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useSwapTransactionBuilder = (
  marketAddress: `0x${string}`,
  inputAmount: AnyNumberString,
  isSell: boolean,
  minOutputAmount: AnyNumberString,
  inBondingCurve: boolean
) => {
  const accountAddress = useAccountAddress();
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
      integratorFeeRateBPs: getDynamicBaseFeeRateBPs({ inBondingCurve }),
      typeTags: toEmojicoinTypesForEntry(marketAddress),
      minOutputAmount: BigInt(minOutputAmount),
    };
  }, [accountAddress, marketAddress, inputAmount, isSell, minOutputAmount, inBondingCurve]);

  return useTransactionBuilder(memoizedArgs, Swap);
};
