let APTOS_NETWORK: string;
let SHORT_REVALIDATE: boolean;

if (process.env.NEXT_PUBLIC_APTOS_NETWORK) {
  APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK;
} else {
  throw new Error("Environment variable NEXT_PUBLIC_APTOS_NETWORK is undefined.");
}

if (process.env.NEXT_PUBLIC_SHORT_REVALIDATE) {
  SHORT_REVALIDATE = process.env.NEXT_PUBLIC_SHORT_REVALIDATE === "true";
} else {
  throw new Error("Environment variable NEXT_PUBLIC_SHORT_REVALIDATE is undefined.");
}

export { APTOS_NETWORK, SHORT_REVALIDATE };
