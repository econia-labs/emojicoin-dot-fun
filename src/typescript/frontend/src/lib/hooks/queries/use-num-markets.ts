import { RegistryView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useQuery } from "@tanstack/react-query";
import { getAptos } from "lib/utils/aptos-client";
import { useEventStore } from "context/state-store-context";

async function getNumMarkets(): Promise<number> {
  const aptos = getAptos();
  return RegistryView.view({ aptos }).then((res) => Number(res.n_markets));
}

export const useNumMarkets = () => {
  const numMarkets = useEventStore((s) => s.symbols.size);
  const res = useQuery({
    queryKey: ["num-markets", numMarkets],
    queryFn: () => {
      return getNumMarkets();
    },
    staleTime: 15000,
  });

  return res;
};
