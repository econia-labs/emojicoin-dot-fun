import { type Events } from "@sdk/emojicoin_dot_fun/events";
import { type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

// TODO: Pass data from server components down to client components
// to reinitialize the store with the data from the server.

export type EventStateValueType = Events & {
  marketData: Types.MarketDataView;
};

export type EventState = {
  events: Record<string, EventStateValueType>;
};

export type EventActions = {
  getMarket: (marketID: number | string | bigint) => EventStateValueType | undefined;
  addSwapEvent: (ev: Types.SwapEvent) => void;
  addLiquidityEvent: (ev: Types.LiquidityEvent) => void;
  addStateEvent: (ev: Types.StateEvent) => void;
  addPeriodicStateEvent: (ev: Types.PeriodicStateEvent) => void;
  addMarketData: (marketID: string, data: Types.MarketDataView) => void;
};

export type EventStore = EventState & EventActions;

export const initializeEventStore = (): EventState => ({ events: {} });

export const defaultState: EventState = initializeEventStore();

export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      getMarket: (marketID) => get().events[marketID.toString()],
      addSwapEvent: (ev) =>
        set((state) => {
          state.events[ev.marketID.toString()].swapEvents.push(ev);
        }),
      addLiquidityEvent: (ev) =>
        set((state) => {
          state.events[ev.marketID.toString()].liquidityEvents.push(ev);
        }),
      addStateEvent: (ev) =>
        set((state) => {
          state.events[ev.marketMetadata.marketID.toString()].stateEvents.push(ev);
        }),
      addPeriodicStateEvent: (ev) =>
        set((state) => {
          state.events[ev.marketMetadata.marketID.toString()].periodicStateEvents.push(ev);
        }),
      addMarketData: (marketID, data) =>
        set((state) => {
          state.events[marketID] = { ...state.events[marketID], marketData: data };
        }),
    }))
  );
};
