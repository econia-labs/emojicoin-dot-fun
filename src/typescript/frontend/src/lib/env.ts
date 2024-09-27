import { type Network } from "@aptos-labs/wallet-adapter-react";
import packageInfo from "../../package.json";
import { parse } from "semver";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";

export type Links = {
  x: string;
  github: string;
  discord: string;
  telegram: string;
  tos: string;
};

let APTOS_NETWORK: Network;
let INTEGRATOR_ADDRESS: AccountAddressString;
let INTEGRATOR_FEE_RATE_BPS: number;
let BROKER_URL: string;

export const LINKS: Links | undefined =
  typeof process.env.NEXT_PUBLIC_LINKS === "string" && process.env.NEXT_PUBLIC_LINKS !== ""
    ? JSON.parse(process.env.NEXT_PUBLIC_LINKS)
    : undefined;

const IS_ALLOWLIST_ENABLED: boolean = process.env.NEXT_PUBLIC_IS_ALLOWLIST_ENABLED === "true";

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

const VERSION = parse(packageInfo.version);

export {
  APTOS_NETWORK,
  INTEGRATOR_ADDRESS,
  INTEGRATOR_FEE_RATE_BPS,
  IS_ALLOWLIST_ENABLED,
  BROKER_URL,
  VERSION,
};
