import packageInfo from "../../package.json";
import { parse } from "semver";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Network } from "@aptos-labs/ts-sdk";

export type Links = {
  x: string;
  github: string;
  discord: string;
  tos: string;
};

const network = process.env.NEXT_PUBLIC_APTOS_NETWORK;
const APTOS_NETWORK = network as Network;
// NOTE: We must check it this way instead of with `NetworkToNetworkName[APTOS_NETWORK]` because
// otherwise the @aptos-labs/ts-sdk package is included in the middleware.ts function and the edge
// runtime won't build properly.
if (!["local", "devnet", "testnet", "mainnet", "custom"].includes(APTOS_NETWORK)) {
  throw new Error(`Invalid network: ${network}`);
}

let INTEGRATOR_ADDRESS: AccountAddressString;
let INTEGRATOR_FEE_RATE_BPS: number;
let BROKER_URL: string;
let CDN_URL: string;

export const LINKS: Links | undefined =
  typeof process.env.NEXT_PUBLIC_LINKS === "string" && process.env.NEXT_PUBLIC_LINKS !== ""
    ? JSON.parse(process.env.NEXT_PUBLIC_LINKS)
    : undefined;

const IS_ALLOWLIST_ENABLED: boolean = process.env.NEXT_PUBLIC_IS_ALLOWLIST_ENABLED === "true";

if (process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS) {
  INTEGRATOR_ADDRESS = process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS as AccountAddressString;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_ADDRESS is undefined.");
}

if (process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS) {
  INTEGRATOR_FEE_RATE_BPS = Number(process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS);
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS is undefined.");
}

if (process.env.NEXT_PUBLIC_BROKER_URL) {
  BROKER_URL = process.env.NEXT_PUBLIC_BROKER_URL;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_BROKER_URL is undefined.");
}

if (process.env.NEXT_PUBLIC_CDN_URL) {
  CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_CDN_URL is undefined.");
}

const VERSION = parse(packageInfo.version);

export {
  APTOS_NETWORK,
  CDN_URL,
  INTEGRATOR_ADDRESS,
  INTEGRATOR_FEE_RATE_BPS,
  IS_ALLOWLIST_ENABLED,
  BROKER_URL,
  VERSION,
};
