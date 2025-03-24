// cspell:word timespan

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

import { fetchLatestPosition } from "@/queries/arena";

export const fetchCache = "force-no-store";

export async function GET(_: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const user = (await params).user;

  if (!AccountAddress.isValid({ input: user, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchLatestPosition({ user });

  return new Response(stringifyJSON(position ?? null));
}
