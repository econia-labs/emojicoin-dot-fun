import { fetchSwapEvents } from "@/queries/market";
import { stringifyJSON } from "utils";
import { GetTradesSchema } from "./schema";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  const { page, sender, limit, marketId, orderBy } = GetTradesSchema.parse(params);
  if (!sender && !marketId) {
    return new Response("At least one of address or marketId is required", { status: 400 });
  }
  const swaps = await fetchSwapEvents({
    sender,
    marketId,
    pageSize: limit,
    page,
    orderBy,
  });

  return new Response(stringifyJSON(swaps));
};
