import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { fetchMarketStateJson } from "@/queries/market";

export const fetchCachedMarketState = unstableCacheWrapper(
  fetchMarketStateJson,
  ["cached-market-state"],
  { revalidate: 2 }
);
