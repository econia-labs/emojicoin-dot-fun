import { stringifyJSON } from "utils";

import { fetchChatEvents } from "@/queries/market";

import { GetChatsSchema } from "./schema";

export const revalidate = 0;

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  const { page, limit, marketID, orderBy } = GetChatsSchema.parse(params);

  const swaps = await fetchChatEvents({ marketID, pageSize: limit, page, orderBy });

  return new Response(stringifyJSON(swaps));
};
