let APTOS_NETWORK: string;

if (process.env.NEXT_PUBLIC_APTOS_NETWORK) {
  APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_APTOS_NETWORK is undefined.");
}

export { APTOS_NETWORK };
