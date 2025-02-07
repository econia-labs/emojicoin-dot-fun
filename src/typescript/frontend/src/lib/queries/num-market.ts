import { fetchNumRegisteredMarkets } from "@/queries/home";
import { unstable_cache } from "next/cache";

export const fetchCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);
