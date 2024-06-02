"use server";

import { cache } from "react";
import { getLatestMarketState } from "@sdk/queries/state";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { SAMPLE_DATA_BASE_URL } from "./const";
import { toMarketRegistrationEvent, toStateEvent } from "@sdk/types";

export const staticLastSwap = async (marketID: string) => {
  try {
    const res = await fetch(new URL(`last-swap-${marketID}.json`, SAMPLE_DATA_BASE_URL));
    const data = await res.json();
    return {
      state: {
        ...toStateEvent(data.state),
        version: data.stateVersion,
      },
      market: {
        ...toMarketRegistrationEvent(data.market),
        version: data.marketVersion,
      },
      emoji: SYMBOL_DATA.byHex(data.market.market_metadata.emoji_bytes)!,
    };
  } catch (e) {
    return null;
  }
};

export const fetchLatestMarketState = cache(async (marketID: string) => {
  const res = await getLatestMarketState({ marketID });

  return res
    ? {
        ...res,
        ...SYMBOL_DATA.byHex(res?.emojiBytes)!,
      }
    : null;
});
