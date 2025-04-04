import { AccountAddress } from "@aptos-labs/ts-sdk";
import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { isValidEmojiHex, symbolBytesToEmojis } from "@/sdk/emoji_data";

export const GetTradesSchema = PaginationSchema.extend({
  sender: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }), {
      message: "Invalid account address format",
    })
    .optional()
    .transform((val) => (val ? AccountAddress.from(val) : undefined)),
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
  symbolEmojis: z
    .string()
    .refine((e) => isValidEmojiHex(e), {
      message: "Invalid emoji hex format",
    })
    .optional()
    .transform((e) => (e ? symbolBytesToEmojis(e).emojis.map((e) => e.emoji) : undefined)),
});
