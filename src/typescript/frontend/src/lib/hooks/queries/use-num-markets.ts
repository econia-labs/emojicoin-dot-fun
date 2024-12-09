import { RegistryView } from "@/contract-apis/emojicoin-dot-fun";
import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "context/event-store-context";
import { getAptosClient } from "@sdk/utils/aptos-client";

async function getNumMarkets(): Promise<number> {
  const aptos = getAptosClient();
  return RegistryView.view({ aptos }).then((res) => Number(res.n_markets));
}

export const useNumMarkets = () => {
  const numMarkets = useEventStore((s) => s.markets.size);
  const res = useQuery({
    queryKey: ["num-markets", numMarkets],
    queryFn: () => {
      return getNumMarkets();
    },
    staleTime: 15000,
  });

  return res;
};
