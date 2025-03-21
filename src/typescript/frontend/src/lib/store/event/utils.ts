import { Period, NON_ARENA_PERIODS, periodEnumToRawDuration } from "@sdk/const";
import { type WritableDraft } from "immer";
import { type EventState, type MarketEventStore, type MarketStoreMetadata } from "./types";
import {
  type PeriodicStateEventModel,
  type SwapEventModel,
  type EventModelWithMarket,
} from "@sdk/indexer-v2/types";
import { getPeriodStartTimeFromTime } from "@sdk/utils";
import { createBarFromPeriodicState, createBarFromSwap } from "./candlestick-bars";
import { q64ToBig, toNominal } from "@sdk/utils/nominal-price";
import { callbackClonedLatestBarIfSubscribed, createInitialCandlestickData } from "../utils";

export const createInitialMarketState = (
  marketMetadata: MarketStoreMetadata
): WritableDraft<MarketEventStore> => ({
  marketMetadata,
  swapEvents: [],
  liquidityEvents: [],
  stateEvents: [],
  chatEvents: [],
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

export const handleLatestBarForSwapEvent = (
  market: WritableDraft<MarketEventStore>,
  event: SwapEventModel
) => {
  for (const period of NON_ARENA_PERIODS) {
    const data = market[period];
    const swapPeriodStart = getPeriodStartTimeFromTime(event.market.time, period);
    const latestBarPeriodStart = BigInt(data.latestBar?.time ?? -1n) * 1000n;
    const shouldCreateNewBar = !data.latestBar || swapPeriodStart > latestBarPeriodStart;
    if (shouldCreateNewBar) {
      const newBar = createBarFromSwap(event, period, data.latestBar?.close);
      data.latestBar = newBar;
      callbackClonedLatestBarIfSubscribed(data.callback, newBar);
    } else if (!data.latestBar) {
      throw new Error("This should never occur. It is a type guard/hint.");
    } else if (event.market.marketNonce >= data.latestBar.nonce) {
      const price = q64ToBig(event.swap.avgExecutionPriceQ64).toNumber();
      data.latestBar.time = Number(getPeriodStartTimeFromTime(event.market.time, period) / 1000n);
      data.latestBar.close = price;
      data.latestBar.high = Math.max(data.latestBar.high, price);
      data.latestBar.low = Math.min(data.latestBar.low, price);
      data.latestBar.nonce = event.market.marketNonce;
      data.latestBar.volume += toNominal(event.swap.quoteVolume);
      // Note this results in `time order violation` errors if we set `has_empty_bars`
      // to `true` in the `LibrarySymbolInfo` configuration.
      callbackClonedLatestBarIfSubscribed(data.callback, data.latestBar);
    }
  }
};

export const handleLatestBarForPeriodicStateEvent = (
  market: WritableDraft<MarketEventStore>,
  event: PeriodicStateEventModel
) => {
  const period = event.periodicMetadata.period;
  const data = market[period];
  const newBar = createBarFromPeriodicState(event);
  // Check if the new bar would be newer than the current latest bar.
  if (
    !data.latestBar ||
    (data.latestBar.nonce < newBar.nonce && data.latestBar.time <= newBar.time)
  ) {
    data.latestBar = newBar;
    // We need to update the latest bar for all periods with any existing swap
    // data for the new given period's time span/time range.
    // NOTE: This assumes `swapEvents` is already sorted in descending order.
    for (const swapEvent of market.swapEvents) {
      const { swap: innerSwap, market: innerMarket } = swapEvent;
      const emitTime = event.market.time;
      const swapTime = innerMarket.time;
      const swapInTimeRange =
        emitTime <= swapTime && swapTime <= emitTime + BigInt(periodEnumToRawDuration(period));

      // NOTE: When a new periodic state event is emitted, the market nonce
      // for the swap event is actually exactly the same as the periodic state event,
      // hence why we use `>=` instead of just `>`.
      if (swapInTimeRange && swapEvent.market.marketNonce >= data.latestBar.nonce) {
        if (!data.latestBar) throw new Error("This should never occur. It is a type guard/hint.");
        const price = q64ToBig(innerSwap.avgExecutionPriceQ64).toNumber();
        data.latestBar.time = Number(getPeriodStartTimeFromTime(innerMarket.time, period) / 1000n);
        data.latestBar.close = price;
        data.latestBar.high = Math.max(data.latestBar.high, price);
        data.latestBar.low = Math.min(data.latestBar.low, price);
        data.latestBar.nonce = innerMarket.marketNonce;
        data.latestBar.volume += toNominal(innerSwap.quoteVolume);
      }
    }
    // Call the callback with the new latest bar.
    // Note this will result in a time order violation if we set the `has_empty_bars`
    // value to `true` in the `LibrarySymbolInfo` configuration.
    callbackClonedLatestBarIfSubscribed(data.callback, data.latestBar);
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
