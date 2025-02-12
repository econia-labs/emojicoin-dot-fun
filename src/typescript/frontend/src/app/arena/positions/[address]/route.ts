import { fetchArenaLeaderboardHistoryWithArenaInfo } from "@/queries/arena";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

const ROWS_RETURNED = 25;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  cookies();
  const address = (await params).address;
  const page = safeParsePageWithDefault(request.nextUrl.searchParams.get("page"));

  if (!AccountAddress.isValid({ input: address, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchArenaLeaderboardHistoryWithArenaInfo({
    user: address,
    page,
    pageSize: ROWS_RETURNED,
  });

  return new Response(stringifyJSON(position ?? undefined));
}
