import "server-only";

import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { fetchArenaInfoJson } from "@/queries/arena";

export const fetchCachedArenaInfo = unstableCacheWrapper(fetchArenaInfoJson, "current-arena-info", {
  revalidate: 2,
});

export const fetchLongerCachedArenaInfo = unstableCacheWrapper(
  fetchArenaInfoJson,
  "current-arena-info",
  { revalidate: 10 }
);
