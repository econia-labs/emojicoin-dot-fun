import { cache } from "react";
import { getLastMarketState } from "@/sdk/queries/state";
import { SYMBOL_DATA } from "@/sdk/emoji_data";
import { SAMPLE_DATA_BASE_URL } from "./const";
import { toMarketRegistrationEvent, toStateEvent } from "@/sdk/types";

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

export const fetchLastMarketState = cache(async (marketID: string) => {
  if (process.env.NEXT_PUBLIC_FORCE_STATIC_FETCH === "true") {
    return staticLastSwap(marketID);
  }

  const res = await getLastMarketState({ marketID });

  return res
    ? {
        state: res.state,
        market: res.market,
        emoji: SYMBOL_DATA.byHex(res.market.marketMetadata.emojiBytes)!,
      }
    : null;
});
