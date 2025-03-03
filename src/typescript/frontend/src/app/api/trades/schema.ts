import { AccountAddress } from "@aptos-labs/ts-sdk";
import { toOrderBy } from "@sdk/indexer-v2/const";
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
