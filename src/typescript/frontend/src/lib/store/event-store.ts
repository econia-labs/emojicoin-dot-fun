import {
  type AnyHomogenousEvent,
  type AnyEmojicoinEvent,
  type Types,
  isGlobalStateEvent,
  isSwapEvent,
  isStateEvent,
  isChatEvent,
  isLiquidityEvent,
  isPeriodicStateEvent,
  isMarketRegistrationEvent,
} from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type AnyNumberString } from "@sdk-types";
import {
  CandlestickResolution,
  RESOLUTIONS_ARRAY,
  toCandlestickResolution,
  toResolutionKey,
} from "@sdk/const";
import { type WritableDraft } from "immer";
import { type MarketIDString, type SymbolString } from "./event-utils";
import { type RegisteredMarket, symbolBytesToEmojis } from "@sdk/emoji_data";
import { AccountAddress, type HexInput } from "@aptos-labs/ts-sdk";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import {
  type LatestBar,
  createNewLatestBar,
  createNewLatestBarFromSwap,
} from "@sdk/utils/candlestick-bars";
import { q64ToBig } from "@sdk/utils/nominal-price";
import {
  toUniqueHomogenousEvents,
  type UniqueHomogenousEvents,
} from "@sdk/emojicoin_dot_fun/events";
import { getPeriodStartTime } from "@sdk/utils";
import { parseJSON, stringifyJSON } from "utils";

type SwapEvent = Types.SwapEvent;
type ChatEvent = Types.ChatEvent;
type MarketRegistrationEvent = Types.MarketRegistrationEvent;
type PeriodicStateEvent = Types.PeriodicStateEvent;
type StateEvent = Types.StateEvent;
type LiquidityEvent = Types.LiquidityEvent;
type GlobalStateEvent = Types.GlobalStateEvent;
type MarketDataView = Types.MarketDataView;

export type CandlestickResolutionData = {
  candlesticks: readonly PeriodicStateEvent[];
  callback: SubscribeBarsCallback | undefined;
  latestBar: LatestBar | undefined;
};

export type EventsWithGUIDs = {
  swapEvents: readonly SwapEvent[];
  chatEvents: readonly ChatEvent[];
  stateEvents: readonly StateEvent[];
  liquidityEvents: readonly LiquidityEvent[];
  [CandlestickResolution.PERIOD_1M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_5M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_15M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_30M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_1H]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_4H]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_1D]: CandlestickResolutionData | undefined;
};

export type MarketStateValueType = EventsWithGUIDs & {
  marketData?: MarketDataView;
};

// NOTE: The usage of readonly here (and above) is to prevent accidental mutations.
// The readonly attribute doesn't indicate these will never change- just that they should only
// be mutated by zustand/immer.
export type EventState = {
  guids: Readonly<Set<string>>;
  firehose: readonly AnyEmojicoinEvent[];
  markets: Readonly<Map<MarketIDString, MarketStateValueType>>;
  symbols: Readonly<Map<SymbolString, MarketIDString>>;
  globalStateEvents: readonly GlobalStateEvent[];
  marketRegistrationEvents: readonly MarketRegistrationEvent[];
  registeredMarketMap: Readonly<Map<MarketIDString, RegisteredMarket>>;
};

type ResolutionSubscription = {
  symbol: string;
  resolution: CandlestickResolution;
  cb: SubscribeBarsCallback;
};

type SetLatestBarsArgs = {
  marketID: MarketIDString;
  latestBars: readonly LatestBar[];
};

export type EventActions = {
  getGuids: () => Set<string>;
  initializeMarket: (marketID: AnyNumberString, symbolOrBytes?: HexInput) => void;
  getMarket: (marketID: AnyNumberString) => MarketStateValueType | undefined;
  getRegisteredMarket: (marketID: AnyNumberString) => RegisteredMarket | undefined;
  getSymbolMap: () => Map<SymbolString, MarketIDString>;
  getMarketIDFromSymbol: (symbol: SymbolString) => MarketIDString | undefined;
  loadEventsFromServer: (eventsIn: Array<AnyHomogenousEvent> | UniqueHomogenousEvents) => void;
  pushEventFromClient: (event: AnyEmojicoinEvent) => void;
  addMarketData: (d: MarketDataView) => void;
  setLatestBars: ({ marketID, latestBars }: SetLatestBarsArgs) => void;
  getRegisteredMarketMap: () => Map<MarketIDString, RegisteredMarket>;
  initializeRegisteredMarketsMap: (data: Array<RegisteredMarket>) => void;
  subscribeToResolution: ({ symbol, resolution, cb }: ResolutionSubscription) => void;
  unsubscribeFromResolution: ({ symbol, resolution }: Omit<ResolutionSubscription, "cb">) => void;
  pushGlobalStateEvent: (event: GlobalStateEvent) => void;
};

export type EventStore = EventState & EventActions;

export const initializeEventStore = (): EventState => {
  return {
    guids: new Set(),
    firehose: [],
    markets: new Map(),
    symbols: new Map(),
    globalStateEvents: [],
    marketRegistrationEvents: [],
    registeredMarketMap: new Map(),
  };
};

const createInitialCandlestickData = (): WritableDraft<CandlestickResolutionData> => ({
  candlesticks: [] as PeriodicStateEvent[],
  callback: undefined,
  latestBar: undefined,
});

export const createInitialMarketState = (): WritableDraft<MarketStateValueType> => ({
  swapEvents: [],
  liquidityEvents: [],
  stateEvents: [],
  chatEvents: [],
  marketData: undefined,
  [CandlestickResolution.PERIOD_1M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_5M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_15M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_30M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_1H]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_4H]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_1D]: createInitialCandlestickData(),
});

export const defaultState: EventState = initializeEventStore();

export const initializeMarketHelper = (
  state: WritableDraft<EventState>,
  marketID: AnyNumberString,
  symbolOrBytes?: HexInput
) => {
  const id = marketID.toString();
  if (!state.markets.has(id)) {
    state.markets.set(id, createInitialMarketState());
  }
  if (symbolOrBytes) {
    const symbol = symbolBytesToEmojis(symbolOrBytes).symbol;
    if (!state.symbols.has(symbol)) {
      state.symbols.set(symbol, id);
    }
  }
};

export const registerMarketHelper = (
  state: WritableDraft<EventState>,
  event: MarketRegistrationEvent
) => {
  const { emojiBytes, marketAddress } = event.marketMetadata;
  const marketID = event.marketMetadata.marketID.toString();
  const emojiData = symbolBytesToEmojis(emojiBytes);
  // Adding to the register market map and symbol map should really be coupled behavior, but
  // we can't enforce that without changing the structure of the data and isn't worth the effort
  // right now.
  // TODO: Couple the behavior of adding a registered market to the map aka marketID => data with
  // adding a symbol => marketID entry.
  state.registeredMarketMap.set(marketID, {
    marketID,
    symbolBytes: `0x${emojiData.emojis.map((e) => e.hex.slice(2)).join("")}`,
    marketAddress: AccountAddress.from(marketAddress).toString(),
    ...emojiData,
  });
  state.symbols.set(emojiData.symbol, marketID);
};

/**
 * A helper function to clone the latest bar and call the callback with it. This is necessary
 * because the TradingView SubscribeBarsCallback function (cb) will mutate the object passed to it.
 * This for some reason causes issues with zustand, so we have this function as a workaround.
 * @param cb the SubscribeBarsCallback to call, from the TradingView charting API
 * @param latestBar the latest bar to clone and pass to the callback. We reduce the scope/type to
 * only the fields that the callback needs, aka `Bar`, a subset of `LatestBar`.
 */
const callbackClonedLatestBarIfSubscribed = (
  cb: SubscribeBarsCallback | undefined,
  latestBar: WritableDraft<LatestBar>
) => {
  if (cb) {
    const nonce = latestBar.marketNonce;
    console.debug(
      `Update latest bar for ${toResolutionKey(latestBar.period)} with mkt nonce ${nonce}`
    );
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

// TODO Consider that we should be using classes with this- it depends how difficult it is to use
// with immer and RSC.
export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      initializeMarket: (marketID, symbolOrBytes) =>
        set((state) => initializeMarketHelper(state, marketID, symbolOrBytes)),
      getSymbolMap: () => get().symbols,
      getMarketIDFromSymbol: (symbol) => get().symbols.get(symbol),
      getMarket: (marketID) => {
        return get().markets.get(marketID.toString())!;
      },
      getGuids: () => get().guids,
      addMarketData: (data) => {
        const marketID = data.marketID.toString();
        set((state) => {
          const market = state.markets.get(marketID);
          if (!market) {
            initializeMarketHelper(state, marketID, data.emojiBytes);
          }
          state.markets.get(marketID)!.marketData = data;
        });
      },
      setLatestBars: ({ marketID, latestBars }) => {
        set((state) => {
          const market = state.markets.get(marketID.toString());
          if (!market) {
            initializeMarketHelper(state, marketID);
          }
          latestBars.forEach((bar) => {
            const resolution = bar.period;
            market![resolution]!.latestBar = bar;
          });
        });
      },
      pushGlobalStateEvent: (event) => {
        set((state) => {
          if (state.guids.has(event.guid)) return;
          state.globalStateEvents.push(event);
          state.guids.add(event.guid);
        });
      },
      // Because these often come from queries, we only do state updates in chunks with arrays.
      // Note that the events here are assumed to be sorted in descending order already, aka
      // latest first.
      // Also note that these events will *not* update the latest bar for the chart data.
      loadEventsFromServer: (eventsIn) => {
        let events: UniqueHomogenousEvents;
        if (Array.isArray(eventsIn)) {
          // Filter out guids and ensure there is only one marketID.
          const res = toUniqueHomogenousEvents(eventsIn, get().guids);
          if (!res) return;
          events = res;
        } else {
          events = eventsIn;
        }

        set((state) => {
          events.guids.forEach((guid) => state.guids.add(guid));
          state.firehose.push(
            ...events.swapEvents,
            ...events.stateEvents,
            ...events.chatEvents,
            ...events.liquidityEvents,
            ...events.candlesticks[CandlestickResolution.PERIOD_1M],
            ...events.candlesticks[CandlestickResolution.PERIOD_5M],
            ...events.candlesticks[CandlestickResolution.PERIOD_15M],
            ...events.candlesticks[CandlestickResolution.PERIOD_30M],
            ...events.candlesticks[CandlestickResolution.PERIOD_1H],
            ...events.candlesticks[CandlestickResolution.PERIOD_4H],
            ...events.candlesticks[CandlestickResolution.PERIOD_1D]
          );
          const marketID = events.marketID.toString();
          if (!state.markets.has(marketID)) {
            initializeMarketHelper(state, marketID);
          }
          const market = state.markets.get(marketID)!;
          market.swapEvents.push(...events.swapEvents);
          market.stateEvents.push(...events.stateEvents);
          market.chatEvents.push(...events.chatEvents);
          market.liquidityEvents.push(...events.liquidityEvents);
          for (const resolution of RESOLUTIONS_ARRAY) {
            const periodicEvents = events.candlesticks[resolution];
            market[resolution]!.candlesticks.push(...periodicEvents);
          }
        });
      },
      // Note that we `unshift` here because we add the latest event to the front of the array.
      // We also update the latest bar if the incoming event is a swap or periodic state event.
      pushEventFromClient: (event) => {
        const keepEvent = (time: bigint) => {
          return time / 1000n > BigInt(new Date().getTime() - 60 * 1_000);
        };
        const cacheSwap = (swap: Types.SwapEvent) => {
          let localSwaps: Types.SwapEvent[] = parseJSON(localStorage.getItem(`swaps`) ?? "[]");
          localSwaps = localSwaps.filter((e) => keepEvent(e.time));
          localSwaps = [...localSwaps, ...(keepEvent(swap.time) ? [swap] : [])];
          localStorage.setItem(`swaps`, stringifyJSON(localSwaps));
        };
        const cacheChat = (chat: Types.ChatEvent) => {
          let localChats: Types.ChatEvent[] = parseJSON(localStorage.getItem(`chats`) ?? "[]");
          localChats = localChats.filter((e) => keepEvent(e.emitTime));
          localChats = [...localChats, ...(keepEvent(chat.emitTime) ? [chat] : [])];
          localStorage.setItem(`chats`, stringifyJSON(localChats));
        };
        if (get().guids.has(event.guid)) return;
        if (event.guid.startsWith("Swap")) {
          cacheSwap(event as Types.SwapEvent);
        }
        if (event.guid.startsWith("Chat")) {
          cacheChat(event as Types.ChatEvent);
        }
        set((state) => {
          state.firehose.unshift(event);
          state.guids.add(event.guid);
          if (isGlobalStateEvent(event)) {
            state.globalStateEvents.unshift(event);
          } else if (isMarketRegistrationEvent(event)) {
            registerMarketHelper(state, event);
            initializeMarketHelper(state, event.marketID, event.marketMetadata.emojiBytes);
          } else {
            if (!state.markets.has(event.marketID.toString())) {
              initializeMarketHelper(state, event.marketID);
            }
            const market = state.markets.get(event.marketID.toString())!;
            if (isStateEvent(event)) {
              market.stateEvents.unshift(event);
            } else if (isChatEvent(event)) {
              market.chatEvents.unshift(event);
            } else if (isLiquidityEvent(event)) {
              market.liquidityEvents.unshift(event);
            } else {
              if (isSwapEvent(event)) {
                const swap = event;
                market.swapEvents.unshift(swap);
                RESOLUTIONS_ARRAY.forEach((resolution) => {
                  const data = market[resolution];
                  if (!data) {
                    throw new Error("No candlestick data found for resolution.");
                  }

                  const swapPeriodStartTime = getPeriodStartTime(swap, resolution);
                  const latestBarPeriodStartTime = BigInt(data.latestBar?.time ?? -1n) * 1000n;
                  // Create a new bar if there is no latest bar or if the swap event's period start
                  // time is newer than the current latest bar's period start time.
                  const shouldCreateNewBar =
                    !data.latestBar || swapPeriodStartTime > latestBarPeriodStartTime;
                  if (shouldCreateNewBar) {
                    const newLatestBar = createNewLatestBarFromSwap(
                      swap,
                      resolution,
                      data.latestBar?.close
                    );
                    data.latestBar = newLatestBar;
                    callbackClonedLatestBarIfSubscribed(data.callback, newLatestBar);
                  } else if (swap.marketNonce >= data.latestBar!.marketNonce) {
                    if (!data.latestBar) {
                      throw new Error("This will never occur- it's just to satisfy TypeScript.");
                    }
                    const price = q64ToBig(swap.avgExecutionPrice).toNumber();
                    data.latestBar.time = Number(getPeriodStartTime(swap, resolution) / 1000n);
                    data.latestBar.close = price;
                    data.latestBar.high = Math.max(data.latestBar.high, price);
                    data.latestBar.low = Math.min(data.latestBar.low, price);
                    data.latestBar.marketNonce = swap.marketNonce;
                    data.latestBar.volume += Number(swap.baseVolume);
                    // Note this results in `time order violation` errors if we set `has_empty_bars`
                    // to `true` in the `LibrarySymbolInfo` configuration.
                    callbackClonedLatestBarIfSubscribed(data.callback, data.latestBar);
                  }
                });
              } else if (isPeriodicStateEvent(event)) {
                const resolution = toCandlestickResolution(event.periodicStateMetadata.period);
                const data = market[resolution];
                if (!data) {
                  throw new Error("No candlestick data found for resolution.");
                }
                data.candlesticks.unshift(event);
                const newLatestBar = createNewLatestBar(event, data.latestBar?.close);
                // Check if the new latest bar would be newer data than the current latest bar.
                if (
                  (data.latestBar?.marketNonce ?? -1n) < newLatestBar.marketNonce &&
                  (data.latestBar?.time ?? -1) <= newLatestBar.time
                ) {
                  data.latestBar = newLatestBar;
                  // We need to update the latest bar for all resolutions with any existing swap
                  // data for the new given resolution's time span/time range.
                  // NOTE: This assumes `swapEvents` is already sorted in descending order.
                  market.swapEvents.forEach((swap) => {
                    const emitTime = event.periodicStateMetadata.emitTime;
                    const swapTime = swap.time;
                    const period = BigInt(resolution);
                    const swapInTimeRange = emitTime <= swapTime && swapTime <= emitTime + period;

                    // NOTE: When a new periodic state event is emitted, the market nonce
                    // for the swap event is actually exactly the same as the periodic state event,
                    // hence why we use `>=` instead of just `>`.
                    if (swapInTimeRange && swap.marketNonce >= data.latestBar!.marketNonce) {
                      const price = q64ToBig(swap.avgExecutionPrice).toNumber();
                      data.latestBar!.time = Number(getPeriodStartTime(swap, resolution) / 1000n);
                      data.latestBar!.close = price;
                      data.latestBar!.marketNonce = swap.marketNonce;
                      data.latestBar!.high = Math.max(data.latestBar!.high, price);
                      data.latestBar!.low = Math.min(data.latestBar!.low, price);
                      data.latestBar!.volume += Number(swap.baseVolume);
                    }
                  });
                  // Call the callback with the new latest bar.
                  // Note this will result in a time order violation if we set the `has_empty_bars`
                  // value to `true` in the `LibrarySymbolInfo` configuration.
                  callbackClonedLatestBarIfSubscribed(data.callback, data.latestBar!);
                }
              }
            }
          }
        });
      },
      initializeRegisteredMarketsMap: (markets) => {
        set((state) => {
          const entries = markets.map((m) => [m.marketID, m] as const);
          state.registeredMarketMap = new Map(entries);
          const newRegisteredMarketMap = new Map<string, RegisteredMarket>();
          const newSymbolToMarketIDMap = new Map<string, string>();
          markets.forEach((mkt) => {
            const { marketID, symbol } = mkt;
            newRegisteredMarketMap.set(marketID, mkt);
            newSymbolToMarketIDMap.set(symbol, marketID);
          });
          state.registeredMarketMap = newRegisteredMarketMap;
          state.symbols = newSymbolToMarketIDMap;
        });
      },
      getRegisteredMarket: (marketID) => {
        return get().registeredMarketMap.get(marketID.toString());
      },
      getRegisteredMarketMap: () => get().registeredMarketMap,
      subscribeToResolution: ({ symbol, resolution, cb }) => {
        const marketID = get().symbols.get(symbol);
        if (!marketID) return;
        const marketForCheck = get().markets.get(marketID);
        if (!marketForCheck) return;
        set((state) => {
          const market = state.markets.get(marketID)!;
          if (!market[resolution]) {
            market[resolution] = createInitialCandlestickData();
          }
          const marketResolution = market[resolution]!;
          marketResolution.callback = cb;
        });
      },
      unsubscribeFromResolution: ({ symbol, resolution }) => {
        const marketID = get().symbols.get(symbol);
        if (!marketID) return;
        const marketForCheck = get().markets.get(marketID);
        if (!marketForCheck) return;
        set((state) => {
          const market = state.markets.get(marketID)!;
          if (!market[resolution]) return;
          market[resolution]!.callback = undefined;
        });
      },
    }))
  );
};
