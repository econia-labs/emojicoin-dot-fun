import { type Events } from "@sdk/emojicoin_dot_fun/events";
import { type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type WritableDraft } from "immer";
import { mergeSortedEvents } from "./event-utils";

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
  periodicStateEvents: { events: PeriodicStateEvent[]; eventUUIDs: Set<string> };
  stateEvents: { events: StateEvent[]; eventUUIDs: Set<string> };
  liquidityEvents: { events: LiquidityEvent[]; eventUUIDs: Set<string> };
};

export type MarketStateValueType = EventsWithUUIDs & {
  marketData?: MarketDataView;
};

export type EventState = {
  markets: Map<string, MarketStateValueType>;
  globalStateEvents: { events: GlobalStateEvent[]; eventUUIDs: Set<string> };
};

export type AnyNumberString = number | string | bigint;
type ArrayOrElement<T> = T | T[];
type AddEventsType<T> = ({ data, sorted }: { data: ArrayOrElement<T>; sorted?: boolean }) => void;

export type EventActions = {
  setMarket: (marketID: AnyNumberString, data: MarketStateValueType) => void;
  /**
   * Note that this function has side effects and is technically an upsert.
   * If the market doesn't exist in the map, it will be created.
   * @param marketID
   * @param data
   * @returns the new market data, possibly an empty market if it was just created
   */
  getMarket: (marketID: AnyNumberString, d?: MarketStateValueType) => MarketStateValueType;
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
  globalStateEvents: { events: [], eventUUIDs: new Set() },
});

export const initializeEmptyMarket = (): MarketStateValueType => ({
  swapEvents: { events: [], eventUUIDs: new Set() },
  liquidityEvents: { events: [], eventUUIDs: new Set() },
  stateEvents: { events: [], eventUUIDs: new Set() },
  periodicStateEvents: { events: [], eventUUIDs: new Set() },
  chatEvents: { events: [], eventUUIDs: new Set() },
  marketRegistrationEvents: { events: [], eventUUIDs: new Set() },
  marketData: undefined,
});

export const defaultState: EventState = initializeEventStore();

export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      setMarket: (marketID, data) =>
        set((state) => {
          state.markets.set(marketID.toString(), data);
        }),
      getMarket: (marketID, data) => {
        if (get().markets.has(marketID.toString())) {
          return get().markets.get(marketID.toString())!;
        }
        const newMarket = data ?? initializeEmptyMarket();
        set((state) => {
          state.markets.set(marketID.toString(), newMarket);
        });
        return newMarket;
      },
      addMarketData: (data) => {
        const marketID = data.marketID.toString();
        if (!get().markets.has(marketID)) {
          set((state) => {
            state.markets.set(marketID, initializeEmptyMarket());
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
      addPeriodicStateEvents: ({ data, sorted }) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.periodicStateMetadata.emitMarketNonce.toString(),
          field: "periodicStateEvents",
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
    }))
  );
};

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
  set: (
    nextStateOrUpdater:
      | EventStore
      | Partial<EventStore>
      | ((state: WritableDraft<EventStore>) => void),
    shouldReplace?: boolean | undefined
  ) => void;
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
    set((state) => {
      state.markets.set(marketID, initializeEmptyMarket());
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
