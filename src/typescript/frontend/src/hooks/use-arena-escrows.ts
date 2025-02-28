import { AccountAddress } from "@aptos-labs/ts-sdk";
import { fetchUserArenaEscrows } from "@sdk/markets/arena-utils";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

export const useArenaEscrows = () => {
  const { aptos, account } = useAptos();
  const accountAddress = useMemo(() => {
    if (!account) {
      return null;
    }
    return AccountAddress.from(account.address);
  }, [account]);

  const { data } = useQuery({
    queryKey: ["user-arena-escrows", accountAddress?.toString()],
    queryFn: () => (accountAddress ? fetchUserArenaEscrows(accountAddress, aptos) : null),
    staleTime: 10 * 1000,
  });

  return data;
};
