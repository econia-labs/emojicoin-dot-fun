import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { QueryKey } from "./query-keys-enum";
import { fetchUserArenaEscrows } from "@sdk/utils/arena/escrow";

export const useArenaEscrows = () => {
  const { aptos, account } = useAptos();
  const accountAddress = useMemo(() => {
    if (!account) {
      return null;
    }
    return AccountAddress.from(account.address);
  }, [account]);

  const { data } = useQuery({
    queryKey: [QueryKey["use-user-escrows"], accountAddress?.toString()],
    queryFn: () => (accountAddress ? fetchUserArenaEscrows(accountAddress, aptos) : null),
    staleTime: 10 * 1000,
  });

  return data;
};
