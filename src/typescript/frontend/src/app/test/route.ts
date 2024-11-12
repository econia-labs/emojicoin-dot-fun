import { getAptos } from "lib/utils/aptos-client";
import { NextResponse } from "next/server";

export const revalidate = 2;
export const fetchCache = "default-cache";

export async function GET() {
  const aptos = getAptos();
  try {
    const version = await aptos.getLedgerInfo().then((res) => res.ledger_version);
    return new NextResponse(version.toString());
  } catch (e) {
    return new NextResponse(JSON.stringify(e), { status: 500 });
  }
}
