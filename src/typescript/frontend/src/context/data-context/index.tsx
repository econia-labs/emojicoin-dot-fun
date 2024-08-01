import { type EventStore } from "@store/event-store";
import { type MarketDataStore } from "@store/market-data";
import { type WebSocketClientStore } from "@store/websocket-store";
import { useContext } from "react";
import { useStore } from "zustand";
import { WebSocketEventContext, MarketDataContext } from "./WebSocketContextProvider";
import type { NameStore } from "@store/name-store";

export const useEventStore = <T,>(selector: (store: EventStore) => T): T => {
  const eventStoreContext = useContext(WebSocketEventContext);

  if (eventStoreContext === null || eventStoreContext.events === null) {
    throw new Error("useEventStore must be used within a EventStoreProvider");
  }

  return useStore(eventStoreContext.events, selector);
};

export const useNameStore = <T,>(selector: (store: NameStore) => T): T => {
  const nameStoreContext = useContext(WebSocketEventContext);

  if (nameStoreContext === null || nameStoreContext.events === null) {
    throw new Error("useNameStore must be used within a EventStoreProvider");
  }

  return useStore(nameStoreContext.names, selector);
};

export const useWebSocketClient = <T,>(selector: (store: WebSocketClientStore) => T): T => {
  const eventStoreContext = useContext(WebSocketEventContext);

  if (eventStoreContext === null || eventStoreContext.client === null) {
    throw new Error("useWebSocketStore must be used within a EventStoreProvider");
  }

  return useStore(eventStoreContext.client, selector);
};
export const useMarketData = <T,>(selector: (store: MarketDataStore) => T): T => {
  const marketDataContext = useContext(MarketDataContext);

  if (marketDataContext === null) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }

  return useStore(marketDataContext, selector);
};
