import { type EventStore } from "@store/event-store";
import { type MarketDataStore } from "@store/market-data";
import { type WebSocketClientStore } from "@store/websocket-store";
import { useContext } from "react";
import { useStore } from "zustand";
import {
  WebSocketEventContext,
  MarketDataContext,
  CoinBalanceContext,
} from "./StateStoreContextProviders";
import { type CoinBalanceStore } from "@store/coin-balance-store";

export const useEventStore = <T,>(selector: (store: EventStore) => T): T => {
  const eventStoreContext = useContext(WebSocketEventContext);

  if (eventStoreContext === null || eventStoreContext.events === null) {
    throw new Error("useEventStore must be used within a EventStoreProvider");
  }

  return useStore(eventStoreContext.events, selector);
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

export const useCoinBalanceStore = <T,>(selector: (store: CoinBalanceStore) => T): T => {
  const coinBalanceContext = useContext(CoinBalanceContext);

  if (coinBalanceContext === null) {
    throw new Error("useCoinBalanceStore must be used within a CoinBalanceProvider");
  }

  return useStore(coinBalanceContext, selector);
};
