import { z } from "zod";

import { isValidEmojiHex, isValidMarketSymbol, symbolBytesToEmojis } from "../../emoji_data";

export const SymbolEmojisSchema = z
  .string()
  .refine((arg) => {
    if (!arg?.length) return false;
    if (!isValidEmojiHex(arg)) return false;
    if (
      !isValidMarketSymbol(
        symbolBytesToEmojis(arg)
          .emojis.map((e) => e.emoji)
          .join("")
      )
    )
      return false;
    return true;
  })
  .transform((val) => symbolBytesToEmojis(val).emojis.map((e) => e.emoji));
