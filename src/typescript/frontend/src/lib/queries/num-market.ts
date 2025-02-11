import { fetchNumRegisteredMarkets } from "@/queries/home";
import { unstable_cache } from "next/cache";

export const getCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);
