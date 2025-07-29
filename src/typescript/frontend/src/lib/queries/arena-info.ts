import "server-only";

import { cacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { fetchArenaInfoJson } from "@/queries/arena";

export const fetchCachedArenaInfo = cacheWrapper(fetchArenaInfoJson, ["current-arena-info"], {
  revalidate: 10,
  tags: ["current-arena-info"],
});
