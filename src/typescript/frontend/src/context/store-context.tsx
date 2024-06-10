"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import { type EventStore, createEventStore } from "@store/event-store";
import { type MarketDataStore, createMarketDataStore } from "@store/market-data";
/**
 * Event Store Context
 */
export const EventStoreContext = createContext<StoreApi<EventStore> | null>(null);

export interface EventStoreProviderProps {
  children: ReactNode;
  initialState?: EventStore;
}

export const EventStoreProvider = ({ children, initialState }: EventStoreProviderProps) => {
  const store = useRef<StoreApi<EventStore>>();
  if (!store.current) {
    store.current = createEventStore(initialState);
  }
  return <EventStoreContext.Provider value={store.current}>{children}</EventStoreContext.Provider>;
};

export const useEventStore = <T,>(selector: (store: EventStore) => T): T => {
  const eventStoreContext = useContext(EventStoreContext);

  if (eventStoreContext === null) {
    throw new Error("useEventStore must be used within a EventStoreProvider");
  }

  return useStore(eventStoreContext, selector);
};

/**
 * Market Data Context
 */
export const MarketDataContext = createContext<StoreApi<MarketDataStore> | null>(null);

export interface MarketDataProviderProps {
  children: ReactNode;
  initialState?: MarketDataStore;
}

export const MarketDataProvider = ({ children, initialState }: MarketDataProviderProps) => {
  const store = useRef<StoreApi<MarketDataStore>>();
  if (!store.current) {
    store.current = createMarketDataStore(initialState);
  }
  return <MarketDataContext.Provider value={store.current}>{children}</MarketDataContext.Provider>;
};

export const useMarketData = <T,>(selector: (store: MarketDataStore) => T): T => {
  const marketDataContext = useContext(MarketDataContext);

  if (marketDataContext === null) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }

  return useStore(marketDataContext, selector);
};
