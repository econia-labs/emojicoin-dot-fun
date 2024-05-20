import { type CandlestickQueryArgs, getAllCandlesticks, getMarketData } from "@econia-labs/emojicoin-sdk";
import { cache } from "react";

export type Markets = Awaited<ReturnType<typeof getMarketData>>;
export type Candlesticks = Awaited<ReturnType<typeof getAllCandlesticks>>;

/**
 * Use this query instead of the raw `getAllMarkets` call to cache the result.
 * This allows us to call this function in different components without having
 * to worry about making redundant fetches.
 */
export const getMarkets: () => Promise<Markets> = cache(async () => {
  const _markets = await getMarketData({});
  const markets = {
    "2": {
      marketID: 2n,
      marketAddress: "0x44af678119fd3f7130828f4f6b396a199d14316dd6c8ab4e343241232d843506",
      emojiBytes: new Uint8Array([240, 159, 159, 165]),
      hex: "f09f9fa5",
      name: "red square",
      emoji: "🟥",
    },
  };
  return markets;
});

export const getCandlesticks: (p: CandlestickQueryArgs) => Promise<Candlesticks> = cache(
  async (args: CandlestickQueryArgs) => {
    const candlesticks = await getAllCandlesticks(args);
    return candlesticks;
  },
);
