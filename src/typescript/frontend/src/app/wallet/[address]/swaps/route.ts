import { fetchSenderSwapEvents } from "@/queries/market";
import { stringifyJSONWithBigInts } from "@sdk/indexer-v2/json-bigint";
import { stringifyJSON } from "utils";

export const GET = async (req: Request, { params }: { params: Promise<{ address: string }> }) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const address = (await params).address;
  console.log(address);
  const swaps = await fetchSenderSwapEvents({
    sender: address,
    page,
  });
  return new Response(stringifyJSON(swaps));
};
