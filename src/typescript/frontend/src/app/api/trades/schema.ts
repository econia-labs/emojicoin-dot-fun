import { AccountAddress } from "@aptos-labs/ts-sdk";
import { isValidEmojiHex, symbolBytesToEmojis } from "@sdk/emoji_data";
import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

export const GetTradesSchema = PaginationSchema.extend({
  sender: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }))
    .optional()
    .transform((val) => (val ? AccountAddress.from(val) : undefined)),
  marketID: z.string().optional(),
  symbolEmojis: z
    .string()
    .refine((e) => isValidEmojiHex(e))
    .optional()
    .transform((e) => (e ? symbolBytesToEmojis(e).emojis.map((e) => e.emoji) : undefined)),
});
