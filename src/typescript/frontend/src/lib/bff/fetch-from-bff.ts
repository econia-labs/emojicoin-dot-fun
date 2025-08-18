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
    cache: "no-store",
    next: {
      revalidate: 0,
    },
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return res.json() as Promise<T>;
}
