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

const vercel = process.env.VERCEL === "1";
const local = process.env.INBOX_URL === "http://localhost:3000";
if (vercel && local) {
  console.warn("Warning: This vercel build is using `localhost:3000` as the inbox endpoint.");
  console.warn("Using sample market data.");
}

export { APTOS_NETWORK, SHORT_REVALIDATE };
