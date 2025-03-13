import { AccountAddress } from "@aptos-labs/ts-sdk";
import { isValidEmojiHex, symbolBytesToEmojis } from "@sdk/emoji_data";
import { toOrderBy } from "@sdk/indexer-v2/const";
import { z } from "zod";

export const GetTradesSchema = z.object({
  sender: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }))
    .optional()
    .transform((val) => (val ? AccountAddress.from(val) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  marketID: z.coerce.number().int().positive().optional(),
  orderBy: z
    .enum(["asc", "desc"])
    .optional()
    .transform((o) => (o ? toOrderBy(o) : undefined)),
  symbolEmojis: z
    .string()
    .refine((e) => isValidEmojiHex(e))
    .optional()
    .transform((e) => (e ? symbolBytesToEmojis(e).emojis.map((e) => e.emoji) : undefined)),
});
