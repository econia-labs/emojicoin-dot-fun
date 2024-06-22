import {
  isChatEvent,
  isGlobalStateEvent,
  isLiquidityEvent,
  isMarketRegistrationEvent,
  isPeriodicStateEvent,
  isStateEvent,
  isSwapEvent,
  type AnyEmojicoinEvent,
  type Types,
} from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type AnyNumberString } from "@sdk-types";
import { CandlestickResolution, toCandlestickResolution } from "@sdk/const";
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

export type EventsWithGUIDs = {
  swapEvents: readonly SwapEvent[];
  chatEvents: readonly ChatEvent[];
  stateEvents: readonly StateEvent[];
  liquidityEvents: readonly LiquidityEvent[];
  [CandlestickResolution.PERIOD_1M]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_5M]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_15M]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_30M]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_1H]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_4H]: readonly PeriodicStateEvent[];
  [CandlestickResolution.PERIOD_1D]: readonly PeriodicStateEvent[];
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

export type EventActions = {
  initializeMarket: (marketID: AnyNumberString, symbolOrBytes?: HexInput) => void;
  getMarket: (marketID: AnyNumberString) => MarketStateValueType | undefined;
  getMarketMetadata: (marketID: AnyNumberString) => DetailedMarketMetadata | undefined;
  getSymbols: () => Map<SymbolString, MarketIDString>;
  getMarketIDFromSymbol: (symbol: SymbolString) => MarketIDString | undefined;
  pushEvents: (events: Array<AnyEmojicoinEvent>) => void;
  pushEventFromWebSocket: (buffer: Buffer) => void;
  addMarketData: (d: MarketDataView) => void;
  initializeMarketMetadata: (data: Array<DetailedMarketMetadata>) => void;
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

export const getInitialMarketState = () => ({
  swapEvents: [],
  liquidityEvents: [],
  stateEvents: [],
  chatEvents: [],
  marketData: undefined,
  [CandlestickResolution.PERIOD_1M]: [],
  [CandlestickResolution.PERIOD_5M]: [],
  [CandlestickResolution.PERIOD_15M]: [],
  [CandlestickResolution.PERIOD_30M]: [],
  [CandlestickResolution.PERIOD_1H]: [],
  [CandlestickResolution.PERIOD_4H]: [],
  [CandlestickResolution.PERIOD_1D]: [],
});

export const defaultState: EventState = initializeEventStore();

export const initializeMarketDraft = (
  state: WritableDraft<EventState>,
  marketID: AnyNumberString,
  symbolOrBytes?: HexInput
) => {
  const id = marketID.toString();
  if (!state.markets.has(id)) {
    state.markets.set(id, getInitialMarketState());
  }
  if (symbolOrBytes) {
    const symbol = symbolBytesToEmojis(symbolOrBytes).symbol;
    if (!state.symbols.has(symbol)) {
      state.symbols.set(symbol, id);
    }
  }
};

// This should REALLY use classes, I just didn't know you could use classes with
// immer when making this.
export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      initializeMarket: (marketID, symbolOrBytes) =>
        set((state) => initializeMarketDraft(state, marketID, symbolOrBytes)),
      getSymbols: () => get().symbols,
      getMarketIDFromSymbol: (symbol) => get().symbols.get(symbol),
      getMarket: (marketID) => {
        return get().markets.get(marketID.toString())!;
      },
      addMarketData: (data) => {
        const marketID = data.marketID.toString();
        if (!get().markets.has(marketID)) {
          get().initializeMarket(marketID, data.emojiBytes);
        }
        return set((state) => {
          state.markets.get(marketID)!.marketData = data;
        });
      },
      // Because these often come from queries, we only do state updates in chunks with arrays.
      // Note that the events here are assumed to be sorted in descending order already, aka
      // latest first.
      pushEvents: (events: Array<AnyEmojicoinEvent>) => {
        if (events.length === 0) return;
        set((state) => {
          events.forEach((event) => {
            if (state.guids.has(event.guid)) return;
            state.firehose.push(event);
            state.guids.add(event.guid);
            if (isGlobalStateEvent(event)) return;
            const marketID = event.marketID.toString();
            if (!state.markets.has(marketID)) initializeMarketDraft(state, marketID);
            const market = state.markets.get(marketID)!;
            if (isSwapEvent(event)) {
              market.swapEvents.push(event);
            } else if (isStateEvent(event)) {
              market.stateEvents.push(event);
            } else if (isChatEvent(event)) {
              market.chatEvents.push(event);
            } else if (isLiquidityEvent(event)) {
              market.liquidityEvents.push(event);
            } else if (isMarketRegistrationEvent(event)) {
              state.marketRegistrationEvents.push(event);
            } else if (isPeriodicStateEvent(event)) {
              const period = Number(event.periodicStateMetadata.period);
              const resolution = toCandlestickResolution[period];
              if (!market[resolution]) {
                market[resolution] = [event];
              } else {
                market[resolution].push(event);
              }
            }
          });
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
            if (!state.markets.has(data.marketID)) initializeMarketDraft(state, data.marketID);
            const market = state.markets.get(data.marketID)!;
            if (isSwapEventFromDB(json)) {
              market.swapEvents.unshift(data.event as Types.SwapEvent);
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
              const resolution = toCandlestickResolution[period];
              if (!market[resolution]) {
                market[resolution] = [event];
              } else {
                market[resolution].unshift(event);
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
    }))
  );
};
