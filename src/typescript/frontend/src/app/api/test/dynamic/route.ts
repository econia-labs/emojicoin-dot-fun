import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const GET = async (_req: NextRequest) => {
  // const res = await fetchCachedDate();
  const url = new URL("/api/test/static", `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  console.info(url);
  const res = await fetch(url).then((res) => res.json());
  return NextResponse.json(res);
};
