import { Period, PERIODS, periodEnumToRawDuration } from "@sdk/const";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import { type WritableDraft } from "immer";
import { type EventState, type CandlestickData, type MarketEventStore } from "./types";
import {
  type MarketMetadataModel,
  type PeriodicStateEventModel,
  type SwapEventModel,
  type TableModels,
} from "@sdk/indexer-v2/types";
import { getPeriodStartTimeFromTime } from "@sdk/utils";
import { createBarFromPeriodicState, createBarFromSwap, type LatestBar } from "./candlestick-bars";
import { q64ToBig } from "@sdk/utils/nominal-price";

type PeriodicState = TableModels["periodic_state_events"];

export const createInitialCandlestickData = (): WritableDraft<CandlestickData> => ({
  candlesticks: [] as PeriodicState[],
  callback: undefined,
  latestBar: undefined,
});

export const createInitialMarketState = (
  marketMetadata: MarketMetadataModel
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
  market: MarketMetadataModel
) => {
  const key = market.symbolData.symbol;
  if (!state.markets.has(key)) {
    state.markets.set(key, createInitialMarketState(market));
  }
};

export const pushPeriodicStateEvents = (
  market: WritableDraft<MarketEventStore>,
  periodicStateEvents: PeriodicState[]
) => {
  periodicStateEvents.forEach((p) => {
    const { period } = p.periodicMetadata;
    market[period].candlesticks.push(p);
  });
};

export const handleLatestBarForSwapEvent = (
  market: WritableDraft<MarketEventStore>,
  event: SwapEventModel
) => {
  for (const period of PERIODS) {
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
    } else if (event.market.marketNonce >= data.latestBar.marketNonce) {
      const price = q64ToBig(event.swap.avgExecutionPriceQ64).toNumber();
      data.latestBar.time = Number(getPeriodStartTimeFromTime(event.market.time, period));
      data.latestBar.close = price;
      data.latestBar.high = Math.max(data.latestBar.high, price);
      data.latestBar.low = Math.min(data.latestBar.low, price);
      data.latestBar.marketNonce = event.market.marketNonce;
      data.latestBar.volume += Number(event.swap.baseVolume);
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
    (data.latestBar.marketNonce < newBar.marketNonce && data.latestBar.time <= newBar.time)
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
      if (swapInTimeRange && swapEvent.market.marketNonce >= data.latestBar.marketNonce) {
        if (!data.latestBar) throw new Error("This should never occur. It is a type guard/hint.");
        const price = q64ToBig(innerSwap.avgExecutionPriceQ64).toNumber();
        data.latestBar.time = Number(getPeriodStartTimeFromTime(innerMarket.time, period) / 1000n);
        data.latestBar.close = price;
        data.latestBar.high = Math.max(data.latestBar.high, price);
        data.latestBar.low = Math.min(data.latestBar.low, price);
        data.latestBar.marketNonce = innerMarket.marketNonce;
        data.latestBar.volume += Number(innerSwap.baseVolume);
      }
    }
    // Call the callback with the new latest bar.
    // Note this will result in a time order violation if we set the `has_empty_bars`
    // value to `true` in the `LibrarySymbolInfo` configuration.
    callbackClonedLatestBarIfSubscribed(data.callback, data.latestBar);
  }
};

/**
 * A helper function to clone the latest bar and call the callback with it. This is necessary
 * because the TradingView SubscribeBarsCallback function (cb) will mutate the object passed to it.
 * This for some reason causes issues with zustand, so we have this function as a workaround.
 * @param cb the SubscribeBarsCallback to call, from the TradingView charting API
 * @param latestBar the latest bar to clone and pass to the callback. We reduce the scope/type to
 * only the fields that the callback needs, aka `Bar`, a subset of `LatestBar`.
 */
export const callbackClonedLatestBarIfSubscribed = (
  cb: SubscribeBarsCallback | undefined,
  latestBar: WritableDraft<LatestBar>
) => {
  if (cb) {
    cb({
      time: latestBar.time,
      open: latestBar.open,
      high: latestBar.high,
      low: latestBar.low,
      close: latestBar.close,
      volume: latestBar.volume,
    });
  }
};
