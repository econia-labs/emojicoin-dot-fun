import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { Schemas } from "@/sdk/utils";

export const GetTradesSchema = PaginationSchema.extend({
  sender: Schemas.AccountAddress.optional(),
  marketID: z
    .union([
      z.coerce.number(),
      z
        .string()
        .refine((val) => !isNaN(parseInt(val)), "Market ID must be a valid number")
        .transform((val) => parseInt(val)),
    ])
    .pipe(
      z.number().int("Market ID must be an integer").min(1, "Market ID must be a positive integer")
    )
    .optional(),
  symbolEmojis: Schemas.SymbolEmojis.optional(),
});
