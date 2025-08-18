import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchAptPrice } from "./fetch";

export const revalidate = 10;
export const dynamic = "error";

export default async function GET(_request: NextRequest) {
  const res = await fetchAptPrice();
  return NextResponse.json(res);
}
