import { type Events } from "@sdk/emojicoin_dot_fun/events";
import { type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type WritableDraft } from "immer";

// TODO: Pass data from server components down to client components
// to reinitialize the store with the data from the server.

export type EventsWithUUIDs = {
  swapEvents: { events: Types.SwapEvent[]; eventUUIDs: Set<string> };
  chatEvents: { events: Types.ChatEvent[]; eventUUIDs: Set<string> };
  marketRegistrationEvents: { events: Types.MarketRegistrationEvent[]; eventUUIDs: Set<string> };
  periodicStateEvents: { events: Types.PeriodicStateEvent[]; eventUUIDs: Set<string> };
  stateEvents: { events: Types.StateEvent[]; eventUUIDs: Set<string> };
  liquidityEvents: { events: Types.LiquidityEvent[]; eventUUIDs: Set<string> };
};

export type MarketStateValueType = EventsWithUUIDs & {
  marketData?: Types.MarketDataView;
};

export type EventState = {
  markets: Map<string, MarketStateValueType>;
  globalStateEvents: { events: Types.GlobalStateEvent[]; eventUUIDs: Set<string> };
};

export type AnyNumberString = number | string | bigint;
type ArrayOrSingle<T> = T | T[];

export type EventActions = {
  setMarket: (marketID: AnyNumberString, data: MarketStateValueType) => void;
  /**
   * Note that this function has side effects and is technically an upsert.
   * If the market doesn't exist in the map, it will be created.
   * @param marketID
   * @param data
   * @returns the new market data, possibly an empty market if it was just created
   */
  getMarket: (marketID: AnyNumberString, data?: MarketStateValueType) => MarketStateValueType;
  addMarketData: (data: Types.MarketDataView) => void;
  addGlobalStateEvents: (data: ArrayOrSingle<Types.GlobalStateEvent>) => void;
  addSwapEvents: (data: ArrayOrSingle<Types.SwapEvent>) => void;
  addLiquidityEvents: (data: ArrayOrSingle<Types.LiquidityEvent>) => void;
  addStateEvents: (data: ArrayOrSingle<Types.StateEvent>) => void;
  addPeriodicStateEvents: (data: ArrayOrSingle<Types.PeriodicStateEvent>) => void;
  addChatEvents: (data: ArrayOrSingle<Types.ChatEvent>) => void;
  addMarketRegistrationEvents: (data: ArrayOrSingle<Types.MarketRegistrationEvent>) => void;
};

export type EventStore = EventState & EventActions;

const ensureArray = <T>(value: ArrayOrSingle<T>): T[] => (Array.isArray(value) ? value : [value]);

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
      addGlobalStateEvents: (data) => {
        const currentUUIDs = get().globalStateEvents.eventUUIDs;
        const events = ensureArray(data).filter((event) => {
          const uuid = event.registryNonce.toString();
          return !currentUUIDs.has(uuid);
        });
        if (events.length === 0) {
          return;
        }
        return set((state) => {
          const mutableUUIDs = state.globalStateEvents.eventUUIDs;
          events.forEach((event) => {
            const uuid = event.registryNonce.toString();
            mutableUUIDs.add(uuid);
            state.globalStateEvents.events.push(event);
          });
        });
      },
      addSwapEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketID.toString(),
          uuid: (e) => e.marketNonce.toString(),
          field: "swapEvents",
        });
      },
      addLiquidityEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketID.toString(),
          uuid: (e) => e.marketNonce.toString(),
          field: "liquidityEvents",
        });
      },
      addStateEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.stateMetadata.marketNonce.toString(),
          field: "stateEvents",
        });
      },
      addPeriodicStateEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.periodicStateMetadata.emitMarketNonce.toString(),
          field: "periodicStateEvents",
        });
      },
      addChatEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.emitMarketNonce.toString(),
          field: "chatEvents",
        });
      },
      addMarketRegistrationEvents: (data) => {
        pushHelper({
          data,
          get,
          set,
          getMarketID: (e) => e.marketMetadata.marketID.toString(),
          uuid: (e) => e.marketMetadata.marketID.toString(),
          field: "marketRegistrationEvents",
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
}: {
  data: ArrayOrSingle<T>;
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

  const immutableUUIDs = get().markets.get(marketID)![field].eventUUIDs;
  const filtered = events.filter((event) => {
    return !immutableUUIDs.has(uuid(event));
  });
  if (filtered.length === 0) {
    return;
  }

  return set((state) => {
    const mutableUUIDs = state.markets.get(marketID)![field].eventUUIDs;
    filtered.forEach((event) => {
      mutableUUIDs.add(uuid(event));
      state.markets.get(marketID)![field].events.push(event);
    });
  });
};
