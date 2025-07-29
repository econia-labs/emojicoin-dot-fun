import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 10;

const fetchCachedDate = unstable_cache(
  async () => {
    const d = new Date();
    return `${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`;
  },
  ["fetch-cached-date-static"],
  { revalidate: 10, tags: ["fetch-cached-date-static"] }
);

export const GET = async (_req: NextRequest) => {
  const res = await fetchCachedDate();
  return NextResponse.json({ value: res });
};
