import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

/**
 * Returns the currently connected account address or `undefined`.
 */
export const useAccountAddress = () => {
  const { account } = useAptos();
  return useMemo(() => account?.address, [account?.address]);
};
