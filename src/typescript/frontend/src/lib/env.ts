import { type Network } from "@aptos-labs/wallet-adapter-react";

let APTOS_NETWORK: Network;
let INTEGRATOR_ADDRESS: string;
let INTEGRATOR_FEE_RATE_BPS: number;

const ALLOWLISTER3K_URL: string | undefined = process.env.NEXT_PUBLIC_ALLOWLISTER3K_URL;
const IS_ALLOWLIST_ENABLED: boolean = process.env.NEXT_PUBLIC_IS_WHITELIST_ENABLED === "true";
const GALXE_CAMPAIGN_ID: string | undefined = process.env.NEXT_PUBLIC_GALXE_CAMPAIGN_ID;

if (process.env.NEXT_PUBLIC_APTOS_NETWORK) {
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK;
  if (["mainnet", "testnet", "devnet", "local", "custom"].includes(network)) {
    APTOS_NETWORK = network as Network;
  } else {
    throw new Error(`Invalid network: ${network}`);
  }
} else {
  throw new Error("Environment variable NEXT_PUBLIC_APTOS_NETWORK is undefined.");
}

if (process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS) {
  INTEGRATOR_ADDRESS = process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_ADDRESS is undefined.");
}

if (process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS) {
  INTEGRATOR_FEE_RATE_BPS = Number(process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS);
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS is undefined.");
}

if (IS_ALLOWLIST_ENABLED && ALLOWLISTER3K_URL === undefined && GALXE_CAMPAIGN_ID === undefined) {
  throw new Error("Allowlist is enabled but no allowlist provider is set.");
}

const vercel = process.env.VERCEL === "1";
const local = process.env.INBOX_URL === "http://localhost:3000";
if (vercel && local) {
  throw new Error(
    "Should not be using `localhost` as the `inbox` endpoint during Vercel deployment."
  );
}

export {
  APTOS_NETWORK,
  INTEGRATOR_ADDRESS,
  INTEGRATOR_FEE_RATE_BPS,
  ALLOWLISTER3K_URL,
  GALXE_CAMPAIGN_ID,
  IS_ALLOWLIST_ENABLED,
};
