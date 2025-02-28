import { fetchSenderSwapEvents } from "@/queries/market";
import { stringifyJSON } from "utils";

export const GET = async (req: Request, { params }: { params: Promise<{ address: string }> }) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const marketId = searchParams.get("market_id");
  const address = (await params).address;
  const swaps = await fetchSenderSwapEvents({
    sender: address,
    marketID: marketId || undefined,
    page,
  });

  return new Response(stringifyJSON(swaps));
};
