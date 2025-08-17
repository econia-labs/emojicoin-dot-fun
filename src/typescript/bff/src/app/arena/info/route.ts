import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchArenaInfoJson } from "@/queries/arena";

export const revalidate = 10;
export const dynamic = "error";
export const fetchCache = "only-no-store";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ slug: string }> }
) {
  const res = await fetchArenaInfoJson();
  return NextResponse.json(res);
}
