"use server";

import { cache } from "react";
import { getLatestMarketState } from "@sdk/queries/state";
import { SYMBOL_DATA } from "@sdk/emoji_data";

export const fetchLatestMarketState = cache(async (marketID: string) => {
  const res = await getLatestMarketState({ marketID });

  return res
    ? {
        ...res,
        ...SYMBOL_DATA.byHex(res?.emojiBytes)!,
      }
    : null;
});
