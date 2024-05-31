import { type Network } from "@aptos-labs/wallet-adapter-react";

let APTOS_NETWORK: Network;
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

if (process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS) {
  INTEGRATOR_ADDRESS = process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_INTEGRATOR_ADDRESS is undefined.");
}

const vercel = process.env.VERCEL === "1";
const local = process.env.INBOX_URL === "http://localhost:3000";
if (vercel && local) {
  throw new Error(
    "Should not be using `localhost` as the `inbox` endpoint during Vercel deployment."
  );
}

export { APTOS_NETWORK, INTEGRATOR_ADDRESS };
