import { type NextRequest, NextResponse } from "next/server";

import { fetchAllMarkets } from "@/queries/static-params";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = false;

export const GET = async (_req: NextRequest) => {
  try {
    const res = await fetchAllMarkets();
    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 400 });
  }
};
