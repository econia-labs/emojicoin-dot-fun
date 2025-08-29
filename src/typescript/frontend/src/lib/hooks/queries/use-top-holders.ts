import { useQuery } from "@tanstack/react-query";
import type { AssetBalance } from "lib/queries/aptos-indexer/fetch-emojicoin-balances";
import { ROUTES } from "router/routes";

async function getTopHoldersRoute(marketAddress: `0x${string}`): Promise<AssetBalance[]> {
  const baseUrl = ROUTES.api["top-holders"];
  const res = fetch(`${baseUrl}/${marketAddress}`);
  return res.then((r) => r.json());
}

export function useTopHolders(marketAddress: `0x${string}`) {
  const { data, isLoading } = useQuery({
    queryKey: ["use-top-holders", marketAddress],
    queryFn: async () => getTopHoldersRoute(marketAddress),
  });

  return { data: data ?? [], isLoading };
}
