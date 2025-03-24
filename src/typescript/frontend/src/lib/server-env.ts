import "server-only";

import { EMOJICOIN_INDEXER_URL } from "@sdk/server/env";

import { APTOS_NETWORK, IS_ALLOWLIST_ENABLED } from "./env";

if (typeof process.env.REVALIDATION_TIME === "undefined") {
  if (process.env.NODE) throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

// We don't export `HASH_SEED` here since it would pollute the Edge Runtime namespace with
// incompatible node.js functions. Instead, just verify that it is valid.
if (!process.env.HASH_SEED || process.env.HASH_SEED.length < 8) {
  throw new Error("Environment variable HASH_SEED must be set and at least 8 characters.");
}

if (IS_ALLOWLIST_ENABLED && typeof process.env.ALLOWLISTER3K_URL === "undefined") {
  throw new Error("Allowlist is enabled but no allowlist provider is set.");
}

if (typeof process.env.REVALIDATION_TIME === "undefined") {
  throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

if (typeof process.env.COINGECKO_API_KEY === "undefined") {
  throw new Error("Environment variable COINGECKO_API_KEY is undefined.");
}

export const GEOBLOCKED: { countries: string[]; regions: string[] } = JSON.parse(
  process.env.GEOBLOCKED ?? '{"countries":[],"regions":[]}'
);
export const GEOBLOCKING_ENABLED = GEOBLOCKED.countries.length > 0 || GEOBLOCKED.regions.length > 0;

export const ALLOWLISTER3K_URL: string | undefined = process.env.ALLOWLISTER3K_URL;
const REVALIDATION_TIME: number = Number(process.env.REVALIDATION_TIME);
export const PRE_LAUNCH_TEASER: boolean = process.env.PRE_LAUNCH_TEASER === "true";
export const COINGECKO_API_KEY: string = process.env.COINGECKO_API_KEY;

if (
  APTOS_NETWORK.toString() === "local" &&
  !EMOJICOIN_INDEXER_URL.includes("localhost") &&
  !EMOJICOIN_INDEXER_URL.includes("docker")
) {
  throw new Error(
    `APTOS_NETWORK is ${APTOS_NETWORK} but the indexer processor url is set to ${EMOJICOIN_INDEXER_URL}`
  );
}

export const MAINTENANCE_MODE: boolean = process.env.MAINTENANCE_MODE === "true";

export const RATE_LIMITER = (() => {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  const enabled = process.env.RATE_LIMITING_ENABLED === "true";
  if (enabled) {
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
      throw new Error("Rate limiting is enabled but there was no URL/token provided for KV.");
    }
    return {
      enabled: true,
      api: {
        url: KV_REST_API_URL,
        token: KV_REST_API_TOKEN,
      },
    } as const;
  }
  return {
    enabled: false,
    api: {
      url: undefined,
      token: undefined,
    },
  } as const;
})();
