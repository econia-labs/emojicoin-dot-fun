import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchLargestMarketID } from "@/queries/home";

export const revalidate = 10;
export const dynamic = "error";

export default async function GET(_request: NextRequest) {
  const res = await fetchLargestMarketID();
  return NextResponse.json(res);
}
