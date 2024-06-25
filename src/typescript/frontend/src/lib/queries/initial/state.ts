"use server";

import { cache } from "react";
import { getLatestMarketState } from "@sdk/queries/state";
import { symbolBytesToEmojis } from "@sdk/emoji_data";

export const fetchLatestMarketState = cache(
  async (emojiBytesOrMarketID: string | bigint | number) => {
    if (!emojiBytesOrMarketID || emojiBytesOrMarketID === "") {
      return null;
    }
    const res = await getLatestMarketState(emojiBytesOrMarketID);

    return res
      ? {
          ...res,
          ...symbolBytesToEmojis(res.emojiBytes),
        }
      : null;
  }
);
