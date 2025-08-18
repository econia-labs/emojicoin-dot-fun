import { getEnv } from "@vercel/functions";

const env = getEnv();

const { VERCEL_BRANCH_URL } = env;

const BFF_DEPLOYMENT_URL = VERCEL_BRANCH_URL
  ? `https://${VERCEL_BRANCH_URL.replace("emojicoin-dot-fun", "emojicoin-dot-fun-bff")}`
  : "http://localhost:3002";
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";

export default async function fetchFromBFF<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, BFF_DEPLOYMENT_URL);
  console.log("_".repeat(100));
  console.log(BFF_DEPLOYMENT_URL);
  console.log(url);
  const res = await fetch(url, {
    headers: {
      "x-vercel-protection-bypass": BYPASS_SECRET,
    },
    next: {
      // The `bff` already handles caching. Force the next frontend deployment not to cache it.
      revalidate: 0,
    },
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return res.json() as Promise<T>;
}
