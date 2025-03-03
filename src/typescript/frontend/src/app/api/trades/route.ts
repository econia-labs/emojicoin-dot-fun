import { fetchSwapEvents } from "@/queries/market";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { toOrderBy } from "@sdk/indexer-v2/const";
import { stringifyJSON } from "utils";
import { z } from "zod";

export const GetTradesSchema = z.object({
  sender: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }))
    .transform((val) => AccountAddress.from(val))
    .optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).optional().default(100),
  marketId: z.string().optional(),
  orderBy: z
    .enum(["asc", "desc"])
    .optional()
    .transform((o) => (o ? toOrderBy(o) : undefined)),
});

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
