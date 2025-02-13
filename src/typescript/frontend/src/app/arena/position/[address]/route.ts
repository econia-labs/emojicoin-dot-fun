// cspell:word timespan

import { fetchLatestPosition } from "@/queries/arena";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(_: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  cookies();
  const address = (await params).address;

  if (!AccountAddress.isValid({ input: address, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchLatestPosition({ user: address });

  return new Response(stringifyJSON(position ?? null));
}
