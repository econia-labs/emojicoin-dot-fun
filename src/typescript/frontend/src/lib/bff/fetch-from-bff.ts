import { getEnv } from "@vercel/functions";

const { VERCEL, VERCEL_URL } = getEnv();

const headers = VERCEL
  ? {
      headers: {
        "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
      },
    }
  : {};

export default async function fetchFromBFF<T>(endpoint: string): Promise<T> {
  const url = new URL(
    `api/test/${endpoint}`,
    VERCEL_URL ? `https://${VERCEL_URL}` : "http://localhost:3001"
  );
  const res = await fetch(url, {
    ...headers,
    next: {
      // Mark it as internal so `next` doesn't try to cache it in on the CDN.
      // Note that this is still deduped as a request in memory, it just isn't stored on the CDN.
      internal: true,
      revalidate: 0,
    } as NextFetchRequestConfig,
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return res.json() as Promise<T>;
}
