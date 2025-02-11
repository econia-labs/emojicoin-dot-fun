import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilder } from "./use-transaction-builder";
import { SetMarketProperties } from "@/contract-apis";
import { AccountAddress } from "@aptos-labs/ts-sdk";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useMarketMetadataTransactionBuilder = (
  marketAddress: string,
  isSubmitEnabled: boolean,
  filledFields: [string, string][]
) => {
  const { account } = useAptos();
  const accountAddress = account?.address;
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
