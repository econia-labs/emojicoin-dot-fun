import { type Network } from "@aptos-labs/wallet-adapter-react";

let APTOS_NETWORK: Network;
let SHORT_REVALIDATE: boolean;
let INTEGRATOR_ADDRESS: string;

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

if (process.env.NEXT_PUBLIC_SHORT_REVALIDATE) {
  SHORT_REVALIDATE = process.env.NEXT_PUBLIC_SHORT_REVALIDATE === "true";
} else {
  throw new Error("Environment variable NEXT_PUBLIC_SHORT_REVALIDATE is undefined.");
}

if (process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS) {
  INTEGRATOR_ADDRESS = process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_ADDRESS is undefined.");
}

const vercel = process.env.VERCEL === "1";
const local = process.env.INBOX_URL === "http://localhost:3000";
if (vercel && local) {
  console.warn("Warning: This vercel build is using `localhost:3000` as the inbox endpoint.");
  console.warn("Using sample market data.");
}

export { APTOS_NETWORK, SHORT_REVALIDATE, INTEGRATOR_ADDRESS };
