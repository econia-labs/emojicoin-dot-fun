// cspell:word upstash
import "server-only";

import { Redis } from "@upstash/redis";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/dist/shared/lib/constants";

import { EMOJICOIN_INDEXER_URL } from "@/sdk/server/env";

import { APTOS_NETWORK, IS_ALLOWLIST_ENABLED } from "./env";

// We don't export `HASH_SEED` here since it would pollute the Edge Runtime namespace with
// incompatible node.js functions. Instead, just verify that it is valid.
if (!process.env.HASH_SEED || process.env.HASH_SEED.length < 8) {
  throw new Error("Environment variable HASH_SEED must be set and at least 8 characters.");
}

if (IS_ALLOWLIST_ENABLED && typeof process.env.ALLOWLISTER3K_URL === "undefined") {
  throw new Error("Allowlist is enabled but no allowlist provider is set.");
}

if (typeof process.env.COINGECKO_API_KEY === "undefined") {
  throw new Error("Environment variable COINGECKO_API_KEY is undefined.");
}

export const GEOBLOCKED: { countries: string[]; regions: string[] } = JSON.parse(
  process.env.GEOBLOCKED ?? '{"countries":[],"regions":[]}'
);
export const GEOBLOCKING_ENABLED = GEOBLOCKED.countries.length > 0 || GEOBLOCKED.regions.length > 0;

export const ALLOWLISTER3K_URL: string | undefined = process.env.ALLOWLISTER3K_URL;
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

export const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;

export const RATE_LIMITER = (() => {
  const enabled = process.env.RATE_LIMITING_ENABLED === "true";
  if (enabled) {
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
      throw new Error("Rate limiting is enabled but Upstash API keys were not provided.");
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

const PHASES = [
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
  "",
] as const;

export const NEXT_PHASE: (typeof PHASES)[number] = (() => {
  const phase = (process.env.NEXT_PHASE ?? "") as (typeof PHASES)[number];
  const validPhase = PHASES.includes(phase);
  if (!validPhase) throw new Error(`Invalid process.env.NEXT_PHASE: ${process.env.NEXT_PHASE}`);
  return phase;
})();

export const IS_NEXT_BUILD_PHASE = NEXT_PHASE === "phase-production-build";

export const CACHE_LOCK_RELEASE = (() => {
  if (process.env.CACHE_LOCK_RELEASE_ENABLED === "true") {
    try {
      if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
        throw new Error(
          "Cache lock and release is enabled but Upstash API keys were not provided."
        );
      }
      const redis = new Redis({
        url: KV_REST_API_URL,
        token: KV_REST_API_TOKEN,
      });
      return { redis };
    } catch (e) {
      console.error(e);
    }
  }
  return undefined;
})();
