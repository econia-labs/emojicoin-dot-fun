import "server-only";
import { IS_ALLOWLIST_ENABLED } from "./env";

let REVALIDATION_TIME: number;

if (process.env.REVALIDATION_TIME) {
  REVALIDATION_TIME = Number(process.env.REVALIDATION_TIME);
} else {
  if (process.env.NODE) throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

const ALLOWLISTER3K_URL: string | undefined = process.env.ALLOWLISTER3K_URL;
const GALXE_CAMPAIGN_ID: string | undefined = process.env.GALXE_CAMPAIGN_ID;

if (IS_ALLOWLIST_ENABLED && ALLOWLISTER3K_URL === undefined && GALXE_CAMPAIGN_ID === undefined) {
  throw new Error("Allowlist is enabled but no allowlist provider is set.");
}

export { ALLOWLISTER3K_URL, GALXE_CAMPAIGN_ID, REVALIDATION_TIME };
