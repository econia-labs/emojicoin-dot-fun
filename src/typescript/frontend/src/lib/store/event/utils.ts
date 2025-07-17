import type { WritableDraft } from "immer";

import { Period } from "@/sdk/const";
import type { EventModelWithMarket } from "@/sdk/indexer-v2/types";

import { createInitialCandlestickData } from "../utils";
import type { EventState, MarketEventStore, MarketStoreMetadata } from "./types";

const createInitialMarketState = (
  marketMetadata: MarketStoreMetadata
): WritableDraft<MarketEventStore> => ({
  marketMetadata,
  swapEvents: [],
  liquidityEvents: [],
  stateEvents: [],
  chatEvents: [],
  [Period.Period15S]: createInitialCandlestickData(),
  [Period.Period1M]: createInitialCandlestickData(),
  [Period.Period5M]: createInitialCandlestickData(),
  [Period.Period15M]: createInitialCandlestickData(),
  [Period.Period30M]: createInitialCandlestickData(),
  [Period.Period1H]: createInitialCandlestickData(),
  [Period.Period4H]: createInitialCandlestickData(),
  [Period.Period1D]: createInitialCandlestickData(),
});

export const ensureMarketInStore = (
  state: WritableDraft<EventState>,
  market: MarketStoreMetadata
) => {
  const key = market.symbolData.symbol;
  if (!state.markets.has(key)) {
    state.markets.set(key, createInitialMarketState(market));
  }
};

export const toMappedMarketEvents = <T extends EventModelWithMarket>(events: Array<T>) => {
  const uniques = new Set(events.map(({ market }) => market.symbolData.symbol));
  const map = new Map(Array.from(uniques).map((symbol) => [symbol, [] as Array<T>]));
  events.forEach((event) => map.get(event.market.symbolData.symbol)!.push(event));
  return map;
};

export const initialState = (): EventState => {
  return {
    guids: new Set<string>(),
    stateFirehose: [],
    marketRegistrations: [],
    markets: new Map(),
    globalStateEvents: [],
  };
};
