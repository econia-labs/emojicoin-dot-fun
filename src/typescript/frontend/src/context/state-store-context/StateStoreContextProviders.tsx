"use client";

import { type ReactNode, createContext, useRef, useEffect } from "react";
import { type StoreApi } from "zustand";

import { type EventStore, createEventStore } from "@store/event-store";
import { type MarketDataStore, createMarketDataStore } from "@store/market-data";
import { type WebSocketClientStore, createWebSocketClientStore } from "@store/websocket-store";

/**
 *
 * -------------------
 * Event Store Context
 * -------------------
 *
 */

export const WebSocketEventContext = createContext<{
  events: StoreApi<EventStore>;
  client: StoreApi<WebSocketClientStore>;
} | null>(null);

export interface WebSocketEventsProviderProps {
  children: ReactNode;
  initialState?: EventStore;
}

export const WebSocketEventsProvider = ({
  children,
  initialState,
}: WebSocketEventsProviderProps) => {
  const events = useRef<StoreApi<EventStore>>(createEventStore(initialState));
  const clientStore = useRef<StoreApi<WebSocketClientStore>>(createWebSocketClientStore());

  useEffect(() => {
    if (!events.current) {
      events.current = createEventStore(initialState);
    }
    if (!clientStore.current) {
      clientStore.current = createWebSocketClientStore();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const contextValue = {
    events: events.current,
    client: clientStore.current,
  };

  return (
    <WebSocketEventContext.Provider value={contextValue}>{children}</WebSocketEventContext.Provider>
  );
};

/**
 *
 * -------------------
 * Market Data Context
 * -------------------
 *
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
