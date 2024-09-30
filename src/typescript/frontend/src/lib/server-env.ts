import "server-only";
import { IS_ALLOWLIST_ENABLED } from "./env";

if (typeof process.env.REVALIDATION_TIME === "undefined") {
  if (process.env.NODE) throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

if (typeof process.env.HASH_SEED === "undefined") {
  throw new Error("Environment variable HASH_SEED is undefined.");
}

if (
  IS_ALLOWLIST_ENABLED &&
  typeof process.env.ALLOWLISTER3K_URL === "undefined" &&
  typeof process.env.GALXE_CAMPAIGN_ID === "undefined"
) {
  throw new Error("Allowlist is enabled but no allowlist provider is set.");
}

if (typeof process.env.REVALIDATION_TIME === "undefined") {
  throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

export const GEOBLOCKED: { countries: string[]; regions: string[] } = JSON.parse(
  process.env.GEOBLOCKED ?? '{"countries":[],"regions":[]}'
);
export const GEOBLOCKING_ENABLED = GEOBLOCKED.countries.length > 0 || GEOBLOCKED.regions.length > 0;

if (GEOBLOCKING_ENABLED) {
  if (process.env.VPNAPI_IO_API_KEY === "undefined") {
    throw new Error(
      "Geoblocking is enabled but environment variable VPNAPI_IO_API_KEY is undefined."
    );
  }
}

export const ALLOWLISTER3K_URL: string | undefined = process.env.ALLOWLISTER3K_URL;
export const GALXE_CAMPAIGN_ID: string | undefined = process.env.GALXE_CAMPAIGN_ID;
export const REVALIDATION_TIME: number = Number(process.env.REVALIDATION_TIME);
export const HASH_SEED: string = process.env.HASH_SEED;
export const VPNAPI_IO_API_KEY: string = process.env.VPNAPI_IO_API_KEY!;
