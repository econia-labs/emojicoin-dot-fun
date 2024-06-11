import { type Events } from "@sdk/emojicoin_dot_fun/events";
import { type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type WritableDraft } from "immer";
import { mergeSortedEvents } from "./event-utils";
import { type AnyNumberString } from "@sdk-types";
import {
  getEmptyGroupedCandlesticks,
  type GroupedPeriodicStateEvents,
} from "@sdk/queries/client-utils/candlestick";
import { type CandlestickResolution } from "@sdk/const";

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

export type EventsWithUUIDs = {
  swapEvents: { events: SwapEvent[]; eventUUIDs: Set<string> };
  chatEvents: { events: ChatEvent[]; eventUUIDs: Set<string> };
  marketRegistrationEvents: { events: MarketRegistrationEvent[]; eventUUIDs: Set<string> };
  periodicStateEvents: { events: GroupedPeriodicStateEvents; eventUUIDs: Set<string> };
  stateEvents: { events: StateEvent[]; eventUUIDs: Set<string> };
  liquidityEvents: { events: LiquidityEvent[]; eventUUIDs: Set<string> };
};

export type MarketStateValueType = EventsWithUUIDs & {
  marketData?: MarketDataView;
};

export type EventState = {
  markets: Map<MarketIDString, MarketStateValueType>;
  symbolToMarketID: Map<SymbolString, MarketIDString>;
  marketIDToSymbol: Map<MarketIDString, SymbolString>;
  globalStateEvents: { events: GlobalStateEvent[]; eventUUIDs: Set<string> };
};

// The type of the `set((state) => ...)` function for the `immer` library.
export type ImmerSetEventStoreFunction = (
  nextStateOrUpdater:
    | EventStore
    | Partial<EventStore>
    | ((state: WritableDraft<EventStore>) => void),
  shouldReplace?: boolean | undefined
) => void;

type ArrayOrElement<T> = T | T[];
type AddEventsType<T> = ({ data, sorted }: { data: ArrayOrElement<T>; sorted?: boolean }) => void;

// Type aliases for more specificity.
type MarketIDString = string;
type SymbolString = string;

export type EventActions = {
  setMarket: (marketID: AnyNumberString, data?: MarketStateValueType) => void;
  maybeInitializeMarket: (marketID: AnyNumberString) => void;
  getMarket: (marketID: AnyNumberString) => MarketStateValueType | undefined;
  getFrozenSymbols: () => Array<SymbolString>;
  getSymbols: () => Map<SymbolString, MarketIDString>;
  getFrozenMarketIDs: () => Array<MarketIDString>;
  getMarketIDs: () => Map<MarketIDString, SymbolString>;
  getMarketIDFromSymbol: (symbol: SymbolString) => MarketIDString | undefined;
  getSymbolFromMarketID: (marketID: AnyNumberString | MarketIDString) => SymbolString | undefined;
  addMarketData: (d: MarketDataView) => void;
  addGlobalStateEvents: AddEventsType<GlobalStateEvent>;
  addSwapEvents: AddEventsType<SwapEvent>;
  addLiquidityEvents: AddEventsType<LiquidityEvent>;
  addStateEvents: AddEventsType<StateEvent>;
  addPeriodicStateEvents: AddEventsType<PeriodicStateEvent>;
  addChatEvents: AddEventsType<ChatEvent>;
  addMarketRegistrationEvents: AddEventsType<MarketRegistrationEvent>;
};

export type EventStore = EventState & EventActions;
const ensureArray = <T>(value: ArrayOrElement<T>): T[] => (Array.isArray(value) ? value : [value]);

export const initializeEventStore = (): EventState => ({
  markets: new Map(),
  symbolToMarketID: new Map(),
  marketIDToSymbol: new Map(),
  globalStateEvents: { events: [], eventUUIDs: new Set() },
});

export const getInitialMarketState = (): MarketStateValueType => ({
  swapEvents: { events: [], eventUUIDs: new Set() },
  liquidityEvents: { events: [], eventUUIDs: new Set() },
  stateEvents: { events: [], eventUUIDs: new Set() },
  periodicStateEvents: { events: getEmptyGroupedCandlesticks(), eventUUIDs: new Set() },
  chatEvents: { events: [], eventUUIDs: new Set() },
  marketRegistrationEvents: { events: [], eventUUIDs: new Set() },
  marketData: undefined,
});

// Should this just be in `createEventStore` and called within there?
// Unsure if `immer` is 💯 like that, i.e., composable.
// Either way, adding a market and adding the mapping from symbol to market ID
// needs to be coupled.
// We also add the mapping from market ID to symbol here.
export const setMarketHelper = (args: {
  marketID: AnyNumberString;
  set: ImmerSetEventStoreFunction;
  data?: MarketStateValueType;
}) => {
  const { set } = args;
  const data = args.data ?? getInitialMarketState();
  const marketID = args.marketID.toString();
  set((state) => {
    state.markets.set(marketID.toString(), data);
    const emojiBytes = data.marketData?.emojiBytes;
    if (emojiBytes && state.symbolToMarketID.has(emojiBytes)) {
      state.symbolToMarketID.set(emojiBytes, marketID);
      state.marketIDToSymbol.set(marketID, emojiBytes);
    }
  });
};

export const defaultState: EventState = initializeEventStore();

export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      setMarket: (marketID, data) =>
        setMarketHelper({
          marketID,
          data,
          set,
        }),
      maybeInitializeMarket: (marketID) => {
        if (!get().markets.has(marketID.toString())) {
          setMarketHelper({
            marketID,
            set,
          });
        }
      },
      /**
       * Gets the current values in the map without triggering state updates when it changes.
       * @returns
       */
      getFrozenSymbols: () => Array.from(get().symbolToMarketID.keys()),
      /**
       * Gets the current values in the map without triggering state updates when it changes.
       * @returns
       */
      getFrozenMarketIDs: () => Array.from(get().marketIDToSymbol.keys()),
      getSymbols: () => get().symbolToMarketID, // These should see state updates.
      getMarketIDs: () => get().marketIDToSymbol, // These should see state updates.
      getMarketIDFromSymbol: (symbol) => get().symbolToMarketID.get(symbol),
      getSymbolFromMarketID: (marketID) => get().marketIDToSymbol.get(marketID.toString()),
      getMarket: (marketID) => {
        // To avoid unnecessary side effects (state updates and thus re-renders),
        // we only set the market if it doesn't exist.
        // if (!get().markets.has(marketID.toString())) {
        //   setMarketHelper({
        //     marketID,
        //     set,
        //     data,
        //   });
        // }
        return get().markets.get(marketID.toString())!;
      },
      addMarketData: (data) => {
        const marketID = data.marketID.toString();
        if (!get().markets.has(marketID)) {
          setMarketHelper({
            marketID,
            set,
          });
        }
        return set((state) => {
          state.markets.get(marketID)!.marketData = data;
        });
      },
      addGlobalStateEvents: ({ data, sorted }) => {
        const currentUUIDs = get().globalStateEvents.eventUUIDs;
        const events = ensureArray(data).filter((event) => {
          const uuid = event.registryNonce.toString();
          return !currentUUIDs.has(uuid);
        });
        if (events.length === 0) {
          return;
        }
        if (!sorted) {
          events.sort((a, b) => a.version - b.version);
        }
        return set((state) => {
          const mutableUUIDs = state.globalStateEvents.eventUUIDs;
          events.forEach((event) => {
            const uuid = event.registryNonce.toString();
            mutableUUIDs.add(uuid);
            state.globalStateEvents.events.push(event);
          });
          // TODO: Optimize later.
          state.globalStateEvents.events.sort((a, b) => b.version - a.version);
        });
      },
      addSwapEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketID.toString(),
          uuid: (e) => e.marketNonce.toString(),
          field: "swapEvents",
          sorted,
        });
      },
      addLiquidityEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketID.toString(),
          uuid: (e) => e.marketNonce.toString(),
          field: "liquidityEvents",
          sorted,
        });
      },
      addStateEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.stateMetadata.marketNonce.toString(),
          field: "stateEvents",
          sorted,
        });
      },
      addChatEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.emitMarketNonce.toString(),
          field: "chatEvents",
          sorted,
        });
      },
      addMarketRegistrationEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.marketMetadata.marketID.toString(),
          field: "marketRegistrationEvents",
          sorted,
        });
      },
      addPeriodicStateEvents: ({ data, sorted }) => {
        const events = ensureArray(data);
        if (events.length === 0) {
          return;
        }
        const marketID = events[0].marketMetadata.marketID.toString();
        if (!get().markets.has(marketID)) {
          setMarketHelper({
            marketID,
            set,
          });
        }

        const market = get().markets.get(marketID)!;
        const immutableUUIDs = market.periodicStateEvents.eventUUIDs;
        const [filteredEvents, filteredUUIDs] = [
          getEmptyGroupedCandlesticks(),
          new Array<string>(),
        ];

        events.forEach((e) => {
          const id = `${e.periodicStateMetadata.period}_${e.periodicStateMetadata.emitMarketNonce}`;
          if (!immutableUUIDs.has(id)) {
            filteredEvents[Number(e.periodicStateMetadata.period) as CandlestickResolution].push(e);
            filteredUUIDs.push(id);
          }
        });

        if (filteredUUIDs.length === 0) {
          return;
        }

        if (!sorted) {
          // Sort in descending order.
          Object.keys(filteredEvents).forEach((key) => {
            filteredEvents[Number(key) as CandlestickResolution].sort(
              (a, b) => b.version - a.version
            );
          });
        }

        return set((state) => {
          Object.keys(state.markets.get(marketID)!.periodicStateEvents.events).forEach((key) => {
            const field = Number(key) as CandlestickResolution;
            state.markets.get(marketID)!.periodicStateEvents.events[field] = mergeSortedEvents(
              state.markets.get(marketID)!.periodicStateEvents.events[field],
              filteredEvents[field]
            );
          });
          state.markets.get(marketID)!.periodicStateEvents.eventUUIDs = new Set([
            ...state.markets.get(marketID)!.periodicStateEvents.eventUUIDs,
            ...filteredUUIDs,
          ]);
        });
      },
    }))
  );
};

// We run this function any time a contract event that is associated with a market ID
// is added to the event store. This function is responsible for pushing the event into the store
// and handling all of the state updates and initializations/side effects that should come with it.
const pushHelper = <T extends AnyEmojicoinEvent>({
  data,
  get,
  set,
  getMarketID,
  /**
   * This is really a unique identifier per market, per event type. So a market nonce
   * that's shared across multiple event types is still valid as a UUID.
   */
  uuid,
  field,
  // We assume it's sorted by default, but we can override this in case for whatever reason
  // we add unsorted data later.
  // Note that to simplify the insertion process and keep it quick, all transaction versions
  // lower than the current latest transaction version are not inserted into the store.
  sorted = true,
}: {
  data: ArrayOrElement<T>;
  get: () => EventStore;
  set: ImmerSetEventStoreFunction;
  getMarketID: (e: Array<T>[number]) => string;
  uuid: (e: Array<T>[number]) => string;
  field: keyof Omit<Events, "events">;
  sorted?: boolean;
}) => {
  const events = ensureArray(data);
  if (events.length === 0) {
    return;
  }

  const marketID = getMarketID(events[0]);
  if (!get().markets.has(marketID)) {
    setMarketHelper({
      marketID,
      set,
    });
  }

  const market = get().markets.get(marketID)!;
  const immutableUUIDs = market[field].eventUUIDs;
  const [filteredEvents, filteredUUIDs] = [new Array<T>(), new Array<string>()];
  events.forEach((event) => {
    const id = uuid(event);
    if (!immutableUUIDs.has(id)) {
      filteredEvents.push(event);
      filteredUUIDs.push(id);
    }
  });

  if (filteredEvents.length === 0) {
    return;
  }

  if (!sorted) {
    // Sort in descending order.
    filteredEvents.sort((a, b) => b.version - a.version);
  }

  return set((state) => {
    state.markets.get(marketID)![field].events = mergeSortedEvents(
      state.markets.get(marketID)![field].events,
      filteredEvents
    );
    state.markets.get(marketID)![field].eventUUIDs = new Set([
      ...state.markets.get(marketID)![field].eventUUIDs,
      ...filteredUUIDs,
    ]);
  });
};
