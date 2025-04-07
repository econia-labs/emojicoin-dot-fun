import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { z } from "zod";

import { sleep } from "@/sdk/index";
import { getProcessorStatus } from "@/sdk/indexer-v2/queries/utils";
import type { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

// The emojicoin indexer, not the Aptos Labs GraphQL indexer.
const fetchLatestProcessorVersion = () =>
  getProcessorStatus().then((res) => res.lastSuccessVersion.toString());

// Cache in-flight fetches within a single request with React's `cache`.
// Then, wrap the inner indexer call with `unstable_cache`, so it's cached across multiple requests.
export const fetchCachedLatestProcessorVersion = cache(
  unstable_cache(fetchLatestProcessorVersion, [], {
    revalidate: 1,
    tags: ["latest-emojicoin-indexer-version"],
  })
);

const FETCH_INTERVAL = 1000;
const TIMEOUT = 10000;
const MAX_TRIES = 10;

export const waitForVersionCached = async (
  minimumVersion: z.infer<typeof PositiveBigIntSchema>,
  timeout = TIMEOUT
) => {
  const tries = Math.floor(timeout / FETCH_INTERVAL);
  const maxTries = Math.min(tries, MAX_TRIES);

  for (let i = 0; i < maxTries; i += 1) {
    const latestVersion = await fetchCachedLatestProcessorVersion()
      .then(BigInt)
      .catch((e) => {
        // Log any errors, but keep fetching.
        console.error(e);
        return -1n;
      });

    if (latestVersion >= minimumVersion) return true;

    await sleep(FETCH_INTERVAL);
  }

  console.trace(`Failed to wait for version ${minimumVersion} after ${maxTries}`);
  return false;
};
