import { getRegistrationGracePeriodFlag } from "@sdk/markets";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";

export const useGracePeriod = (symbol: string) => {
  const { aptos } = useAptos();

  return useQuery({
    queryKey: ["grace-period", symbol],
    queryFn: () => {
      return getRegistrationGracePeriodFlag({
        aptos,
        symbol,
      });
    },
    staleTime: 2000,
  });
};
