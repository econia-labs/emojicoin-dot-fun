import { getEnv } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchArenaInfoJson } from "@/queries/arena";

export const revalidate = 10;
export const dynamic = "error";

export async function GET(_request: NextRequest) {
  const env = getEnv();
  console.debug(JSON.stringify(env, null, 2));

  const res = await fetchArenaInfoJson();
  return NextResponse.json(res);
}
