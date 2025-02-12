import { fetchArenaLeaderboardHistoryWithArenaInfo } from "@/queries/arena";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

const ROWS_RETURNED = 25;

export const fetchCache = "force-no-store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const user = (await params).user;
  const page = safeParsePageWithDefault(request.nextUrl.searchParams.get("page"));

  if (!AccountAddress.isValid({ input: user, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchArenaLeaderboardHistoryWithArenaInfo({
    user,
    page,
    pageSize: ROWS_RETURNED,
  });

  return new Response(stringifyJSON(position ?? undefined));
}
