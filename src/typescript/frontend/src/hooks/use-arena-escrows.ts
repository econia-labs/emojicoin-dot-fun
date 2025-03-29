import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { fetchUserArenaEscrows } from "@sdk/utils/arena/escrow";
import { toStandardizedAddress } from "@sdk/utils";

export const useArenaEscrows = () => {
  const { aptos, account } = useAptos();

  const accountAddress = useMemo(
    () => (account ? toStandardizedAddress(account.address) : null),
    [account]
  );

  const { data } = useQuery({
    queryKey: ["use-user-escrows", accountAddress ?? ""],
    queryFn: () => (accountAddress ? fetchUserArenaEscrows(accountAddress, aptos) : null),
    staleTime: 10 * 1000,
    enabled: !!accountAddress,
  });

  return data;
};
