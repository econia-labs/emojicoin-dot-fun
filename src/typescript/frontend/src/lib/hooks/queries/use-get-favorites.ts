import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";

import { ViewFavorites } from "@/contract-apis";
import { getAptosClient } from "@/sdk/utils";

async function getFavorites(address: string) {
  const aptos = getAptosClient();
  return ViewFavorites.view({ aptos, user: address }).then((res) => res);
}

export function useGetFavorites() {
  const { account } = useAptos();

  return useQuery({
    queryKey: ["useGetFavorites", account?.address],
    queryFn: () => (!account?.address ? [] : getFavorites(account.address)),
    enabled: !!account,
  });
}
