import { unstable_cache } from "next/cache";

import { fetchLargestMarketID } from "@/queries/home";

export const fetchCachedNumRegisteredMarkets = unstable_cache(
  fetchLargestMarketID,
  ["num-registered-markets"],
  {
    revalidate: 10,
    tags: ["num-registered-markets"],
  }
);
