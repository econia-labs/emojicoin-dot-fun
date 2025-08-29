import "server-only";

import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import type { z } from "zod";

import { sleep } from "@/sdk/index";
import { getProcessorStatus } from "@/sdk/indexer-v2/queries/utils";
import type { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

// The emojicoin indexer, not the Aptos Labs GraphQL indexer.
const fetchLatestProcessorVersion = () =>
  getProcessorStatus().then((res) => res.lastSuccessVersion.toString());

export const fetchCachedLatestProcessorVersion = unstableCacheWrapper(
  fetchLatestProcessorVersion,
  "latest-emojicoin-indexer-version",
  { revalidate: 1 }
);

const FETCH_INTERVAL = 1000;
const MAX_TRIES = 5;

export const waitForVersionCached = async (
  minimumVersion: z.infer<typeof PositiveBigIntSchema>
) => {
  for (let i = 0; i < MAX_TRIES; i += 1) {
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

  console.trace(`Failed to wait for version ${minimumVersion} after ${MAX_TRIES}`);
  return false;
};
