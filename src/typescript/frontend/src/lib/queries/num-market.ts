import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { fetchLargestMarketID } from "@/queries/home";

export const fetchCachedNumRegisteredMarkets = unstableCacheWrapper(
  fetchLargestMarketID,
  ["num-registered-markets"],
  {
    revalidate: 10,
    tags: ["num-registered-markets-from-aptos-node"],
  }
);
