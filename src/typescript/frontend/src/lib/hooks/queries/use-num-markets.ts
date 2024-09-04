import { RegistryView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useQuery } from "@tanstack/react-query";
import { getAptos } from "lib/utils/aptos-client";

async function getNumMarkets(): Promise<number> {
  const aptos = getAptos();
  return RegistryView.view({ aptos }).then((res) => Number(res.n_markets));
}

export const useNumMarkets = () => {
  const res = useQuery({
    queryKey: ["num-markets"],
    queryFn: () => {
      return getNumMarkets();
    },
    staleTime: 30000,
  });

  return res;
};
