const BFF_DEPLOYMENT_URL = `https://${process.env.VERCEL_BRANCH_URL || ""}`;
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";

export default async function fetchFromBFF<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, BFF_DEPLOYMENT_URL);
  const res = await fetch(url, {
    headers: {
      "x-vercel-protection-bypass": BYPASS_SECRET,
    },
    next: {
      // The `bff` already handles caching. Force the next frontend deployment not to cache it.
      revalidate: 0,
    },
  });

  return res.json() as Promise<T>;
}
