import { unstable_cache } from "next/cache";

import { fetchNumRegisteredMarkets } from "@/queries/home";

export const fetchCachedNumMarketsFromAptosNode = unstable_cache(
  fetchNumRegisteredMarkets,
  ["num-registered-markets"],
  { revalidate: 10 }
);
