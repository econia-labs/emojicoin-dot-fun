import { fetchSwapEvents } from "@/queries/market";
import { stringifyJSON } from "utils";
import { GetTradesSchema } from "./schema";

export const revalidate = 0;

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  const { page, sender, limit, marketId, orderBy, symbolEmojis } = GetTradesSchema.parse(params);
  if (!sender && !marketId && !symbolEmojis) {
    return new Response("At least one of address, marketId or symbolEmojis is required", {
      status: 400,
    });
  }

  const swaps = await fetchSwapEvents({
    sender,
    marketID: marketId,
    pageSize: limit,
    page,
    orderBy,
    symbolEmojis,
  });

  return new Response(stringifyJSON(swaps));
};
