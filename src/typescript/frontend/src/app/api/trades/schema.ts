import { AccountAddress } from "@aptos-labs/ts-sdk";
import { isValidEmojiHex, symbolBytesToEmojis } from "@sdk/emoji_data";
import { toOrderBy } from "@sdk/indexer-v2/const";
import { z } from "zod";

export const GetTradesSchema = z.object({
  sender: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }), {
      message: "Invalid account address format",
    })
    .optional()
    .transform((val) => (val ? AccountAddress.from(val) : undefined)),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("Limit must be positive")
    .max(100, "Maximum limit is 100")
    .default(100),
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
  orderBy: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" }),
    })
    .optional()
    .transform((o) => (o ? toOrderBy(o) : undefined)),
  symbolEmojis: z
    .string()
    .refine((e) => isValidEmojiHex(e), {
      message: "Invalid emoji hex format",
    })
    .optional()
    .transform((e) => (e ? symbolBytesToEmojis(e).emojis.map((e) => e.emoji) : undefined)),
});
