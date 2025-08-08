import "server-only";

import { unstable_cache } from "next/cache";

import { fetchArenaInfoJson } from "@/queries/arena";

export const fetchCachedArenaInfo = unstable_cache(fetchArenaInfoJson, ["current-arena-info"], {
  revalidate: 2,
  tags: ["current-arena-info"],
});
