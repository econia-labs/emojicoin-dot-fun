import { type AnyHomogenousEvent, type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type AnyNumberString } from "@sdk-types";
import {
  CandlestickResolution,
  RESOLUTIONS_ARRAY,
  toCandlestickResolution,
  toResolutionKey,
} from "@sdk/const";
import { type DBJsonData } from "@sdk/emojicoin_dot_fun";
import { type AnyEmojicoinJSONEvent } from "@sdk/types/json-types";
import { type WritableDraft } from "immer";
import {
  type MarketIDString,
  type SymbolString,
  isSwapEventFromDB,
  deserializeEvent,
  isGlobalStateEventFromDB,
  isStateEventFromDB,
  isPeriodicStateEventFromDB,
  isChatEventFromDB,
  isLiquidityEventFromDB,
  isMarketRegistrationEventFromDB,
} from "./event-utils";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { type HexInput } from "@aptos-labs/ts-sdk";
import { type DetailedMarketMetadata } from "lib/queries/types";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import { type LatestBar, createNewLatestBar } from "@sdk/utils/candlestick-bars";
import { q64ToBig } from "@sdk/utils/nominal-price";
import { toHomogenousEvents, type HomogenousEventStructure } from "@sdk/emojicoin_dot_fun/events";

type SwapEvent = Types.SwapEvent;
type ChatEvent = Types.ChatEvent;
type MarketRegistrationEvent = Types.MarketRegistrationEvent;
type PeriodicStateEvent = Types.PeriodicStateEvent;
type StateEvent = Types.StateEvent;
type LiquidityEvent = Types.LiquidityEvent;
type GlobalStateEvent = Types.GlobalStateEvent;
type MarketDataView = Types.MarketDataView;

// TODO: Pass data from server components down to client components
// to reinitialize the store with the data from the server.

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

// Note the usage of readonly here (and above) is to prevent accidental mutations.
// The readonly attribute doesn't indicate these will never change- just that they should only
// be mutated by zustand/immer.
export type EventState = {
  guids: Readonly<Set<string>>;
  firehose: readonly AnyEmojicoinEvent[];
  markets: Readonly<Map<MarketIDString, MarketStateValueType>>;
  symbols: Readonly<Map<SymbolString, MarketIDString>>;
  globalStateEvents: readonly GlobalStateEvent[];
  marketRegistrationEvents: readonly MarketRegistrationEvent[];
  // This will very rarely, if ever, be mutated. This is used primarily for supplying the
  // TradingView chart with symbol search data.
  marketMetadataMap: Readonly<Map<MarketIDString, DetailedMarketMetadata>>;
};

// type SetLatestBarArgs = {
//   marketID: MarketIDString;
//   resolution: CandlestickResolution;
//   bar: LatestBar;
// };

type ResolutionSubscription = {
  symbol: string;
  resolution: CandlestickResolution;
  cb: SubscribeBarsCallback;
};

export type EventActions = {
  initializeMarket: (marketID: AnyNumberString, symbolOrBytes?: HexInput) => void;
  getMarket: (marketID: AnyNumberString) => MarketStateValueType | undefined;
  getMarketMetadata: (marketID: AnyNumberString) => DetailedMarketMetadata | undefined;
  getSymbols: () => Map<SymbolString, MarketIDString>;
  getMarketIDFromSymbol: (symbol: SymbolString) => MarketIDString | undefined;
  pushEvents: (eventsIn: Array<AnyHomogenousEvent> | HomogenousEventStructure) => void;
  pushEventFromWebSocket: (buffer: Buffer) => void;
  addMarketData: (d: MarketDataView) => void;
  // setLatestBar: ({ marketID, resolution, bar }: SetLatestBarArgs) => void;
  setLatestBars: ({
    marketID,
    latestBars,
  }: {
    marketID: MarketIDString;
    latestBars: Array<LatestBar>;
  }) => void;
  initializeMarketMetadata: (data: Array<DetailedMarketMetadata>) => void;
  subscribeToResolution: ({ symbol, resolution, cb }: ResolutionSubscription) => void;
  unsubscribeFromResolution: ({ symbol, resolution }: Omit<ResolutionSubscription, "cb">) => void;
  pushGlobalStateEvent: (event: GlobalStateEvent) => void;
  pushMarketRegistrationEvent: (event: MarketRegistrationEvent) => void;
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
    marketMetadataMap: new Map(),
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

function deepClone(value) {
  return typeof value === "object" && value !== null
    ? Array.isArray(value)
      ? value.map(deepClone)
      : Object.keys(value).reduce(
          (acc, key) => ({
            ...acc,
            [key]: deepClone(value[key]),
          }),
          {}
        )
    : value;
}

// TODO Consider that we should be using classes with this- it depends how difficult it is to use
// with immer and RSC.
export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      initializeMarket: (marketID, symbolOrBytes) =>
        set((state) => initializeMarketHelper(state, marketID, symbolOrBytes)),
      getSymbols: () => get().symbols,
      getMarketIDFromSymbol: (symbol) => get().symbols.get(symbol),
      getMarket: (marketID) => {
        return get().markets.get(marketID.toString())!;
      },
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
            console.log(resolution);
            console.log({ ...market![resolution] });
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
      pushMarketRegistrationEvent: (event) => {
        set((state) => {
          if (state.guids.has(event.guid)) return;
          state.marketRegistrationEvents.push(event);
          state.guids.add(event.guid);
        });
      },
      // Because these often come from queries, we only do state updates in chunks with arrays.
      // Note that the events here are assumed to be sorted in descending order already, aka
      // latest first.
      pushEvents: (eventsIn) => {
        let events: HomogenousEventStructure | undefined;
        if (Array.isArray(eventsIn)) {
          events = toHomogenousEvents(eventsIn, get().guids);
        } else {
          events = eventsIn;
        }
        // If no events are found, we return early.
        if (!events) return;

        set((state) => {
          // toHomogenousEvents already filtered out guids and ensured there is only one marketID.
          events.guids.forEach((guid) => state.guids.add(guid));
          state.firehose.push(
            ...[
              ...events.swapEvents,
              ...events.stateEvents,
              ...events.chatEvents,
              ...events.liquidityEvents,
            ]
          );
          if (!events.marketID) {
            throw new Error("No market ID or global state events found.");
          }
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
            const marketResolution = market[resolution]!;
            if (periodicEvents.length === 0) continue;
            marketResolution.candlesticks.push(...periodicEvents);
          }
        });
      },
      // We generally push WebSocket events one at a time.
      // Note that we `unshift` here because we add the latest event to the front of the array.
      pushEventFromWebSocket: (buffer) => {
        try {
          const json = JSON.parse(buffer.toString()) as DBJsonData<AnyEmojicoinJSONEvent>;
          if (!json) return;
          const data = deserializeEvent(json, json.transaction_version);
          if (!data) return;
          if (get().guids.has(data.event.guid)) return;
          set((state) => {
            state.firehose.unshift(data.event);
            state.guids.add(data.event.guid);
            if (isGlobalStateEventFromDB(json)) return;
            if (!data.marketID) throw new Error("No market ID found in event.");
            if (!state.markets.has(data.marketID)) initializeMarketHelper(state, data.marketID);
            const market = state.markets.get(data.marketID)!;
            if (isSwapEventFromDB(json)) {
              const swap = data.event as Types.SwapEvent;
              console.log(market.swapEvents.length);
              console.log(market.swapEvents.slice(0, 3).map((e) => e.guid));
              market.swapEvents.unshift(swap);
              console.log(swap.guid);
              console.log(market.swapEvents[0].guid);
              console.log(market.swapEvents.length);
              const resolutions = RESOLUTIONS_ARRAY;
              resolutions.forEach((resolution) => {
                const data = market[resolution];
                console.log(data);
                console.log(deepClone(data?.latestBar));
                console.log(deepClone(data?.latestBar?.marketNonce));
                console.log(swap.marketNonce);
                if (data && data.latestBar && swap.marketNonce > data.latestBar.marketNonce) {
                  const price = q64ToBig(swap.avgExecutionPrice).toNumber();
                  data.latestBar.close = price;
                  data.latestBar.high = Math.max(data.latestBar.high, price);
                  data.latestBar.low = Math.min(data.latestBar.low, price);
                  data.latestBar.marketNonce = swap.marketNonce;
                  data.latestBar.volume += Number(swap.baseVolume);
                  if (data.callback) {
                    const clone = deepClone(data.latestBar);
                    data.callback(clone);
                    console.log("callling callback from ", toResolutionKey(resolution), swap.guid);
                  }
                  console.log(toResolutionKey(resolution), swap.guid, data.latestBar);
                }
              });
            } else if (isStateEventFromDB(json)) {
              market.stateEvents.unshift(data.event as Types.StateEvent);
            } else if (isChatEventFromDB(json)) {
              market.chatEvents.unshift(data.event as Types.ChatEvent);
            } else if (isLiquidityEventFromDB(json)) {
              market.liquidityEvents.unshift(data.event as Types.LiquidityEvent);
            } else if (isMarketRegistrationEventFromDB(json)) {
              state.marketRegistrationEvents.unshift(data.event as Types.MarketRegistrationEvent);
            } else if (isPeriodicStateEventFromDB(json)) {
              const event = data.event as Types.PeriodicStateEvent;
              const period = Number(event.periodicStateMetadata.period);
              const resolution = toCandlestickResolution(period);
              let marketRes = market[resolution];
              if (!marketRes) {
                market[resolution] = createInitialCandlestickData();
              }
              marketRes = market[resolution]!;
              marketRes.candlesticks.unshift(event);
              marketRes.latestBar = createNewLatestBar(event);
              console.log("latest bar???");
              console.log("-".repeat(200));
              console.log(marketRes.latestBar);
              if (marketRes.callback) {
                // Ossify/finalize the current bar (make it immutable) by creating a new latest bar.
                const clone = deepClone(marketRes.latestBar);
                marketRes.callback(clone);
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      },
      initializeMarketMetadata: (markets) => {
        set((state) => {
          const entries = markets.map((m) => [m.marketID, m] as const);
          state.marketMetadataMap = new Map(entries);
          const newMarketMetadataMap = new Map<string, DetailedMarketMetadata>();
          const newSymbolToMarketIDMap = new Map<string, string>();
          markets.forEach((mkt) => {
            const { marketID, symbol } = mkt;
            newMarketMetadataMap.set(marketID, mkt);
            newSymbolToMarketIDMap.set(symbol, marketID);
          });
          state.marketMetadataMap = newMarketMetadataMap;
          state.symbols = newSymbolToMarketIDMap;
        });
      },
      getMarketMetadata: (marketID) => {
        return get().marketMetadataMap.get(marketID.toString());
      },
      subscribeToResolution: ({ symbol, resolution, cb }) => {
        console.log("SUBSCRIBE TO RESOLUTION");
        const marketID = get().symbols.get(symbol);
        if (!marketID) return;
        const marketForCheck = get().markets.get(marketID);
        if (!marketForCheck) return;
        set((state) => {
          const market = state.markets.get(marketID)!;
          if (!market[resolution]) {
            market[resolution] = createInitialCandlestickData();
          }
          const candlestickData = market[resolution]!;
          candlestickData.callback = cb;
          if (candlestickData.latestBar) {
            const clone = deepClone(candlestickData.latestBar);
            candlestickData.callback(clone);
            console.log("Updating latest bar from subscribeToResolution.");
            console.debug("resolution", resolution);
            console.debug("latest bar", candlestickData.latestBar);
          }
        });

        console.log("Subscribed to resolution", resolution, "for symbol", symbol);
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
