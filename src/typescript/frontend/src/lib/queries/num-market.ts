import { unstable_cache } from "next/cache";

import { fetchNumRegisteredMarkets } from "@/queries/home";

export const getCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);
