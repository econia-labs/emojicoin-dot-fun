import { getAptos } from "lib/utils/aptos-client";
import { NextResponse } from "next/server";

export const revalidate = 1;

export async function GET() {
  const aptos = getAptos();
  try {
    const version = await aptos.getLedgerInfo().then((res) => res.ledger_version);
    return new NextResponse(version.toString());
  } catch {
    return new NextResponse("", { status: 500 });
  }
}
