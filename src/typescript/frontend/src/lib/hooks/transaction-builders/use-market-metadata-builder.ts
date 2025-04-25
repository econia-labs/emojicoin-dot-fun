import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { SetMarketProperties } from "@/move-modules";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useMarketMetadataTransactionBuilder = (
  marketAddress: string,
  isSubmitEnabled: boolean,
  filledFields: [string, string][]
) => {
  const accountAddress = useAccountAddress();
  const memoizedArgs = useMemo(() => {
    const isValidAddress = AccountAddress.isValid({ input: marketAddress }).valid;
    if (!accountAddress || !isSubmitEnabled || !isValidAddress) {
      return null;
    }
    return {
      admin: accountAddress,
      market: marketAddress,
      keys: filledFields.map(([key, _]) => key),
      values: filledFields.map(([_, value]) => value),
    };
  }, [accountAddress, isSubmitEnabled, filledFields, marketAddress]);

  return useTransactionBuilder(memoizedArgs, SetMarketProperties);
};
