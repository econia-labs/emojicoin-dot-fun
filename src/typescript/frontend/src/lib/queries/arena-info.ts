import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { fetchArenaInfoJson } from "@/queries/arena";

// Cache in-flight fetches within a single request with React's `cache`.
// Then, wrap the inner indexer call with `unstable_cache`, so it's cached across multiple requests.
export const fetchCachedArenaInfo = cache(
  unstable_cache(fetchArenaInfoJson, [], {
    revalidate: 2,
    tags: ["current-arena-info"],
  })
);
