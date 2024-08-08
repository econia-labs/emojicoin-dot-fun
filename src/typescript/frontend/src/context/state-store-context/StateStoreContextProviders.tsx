"use client";

import { type ReactNode, createContext, useRef, useEffect } from "react";
import { type StoreApi } from "zustand";

import { type EventStore, createEventStore } from "@store/event-store";
import { type WebSocketClientStore, createWebSocketClientStore } from "@store/websocket-store";
import createUserSettingsStore, { type UserSettingsStore } from "@store/user-settings-store";

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

const appClientStore = createWebSocketClientStore();

export const WebSocketEventsProvider = ({
  children,
  initialState,
}: WebSocketEventsProviderProps) => {
  const events = useRef<StoreApi<EventStore>>(createEventStore(initialState));
  const clientStore = useRef<StoreApi<WebSocketClientStore>>(appClientStore);

  useEffect(() => {
    if (!events.current) {
      events.current = createEventStore(initialState);
    }
    if (!clientStore.current) {
      clientStore.current = appClientStore;
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
 * ---------------------
 * User Settings Context
 * ---------------------
 *
 */
export const UserSettingsContext = createContext<StoreApi<UserSettingsStore> | null>(null);

export interface UserSettingsProviderProps {
  children: ReactNode;
  initialState?: UserSettingsStore;
}

export const UserSettingsProvider = ({ children, initialState }: UserSettingsProviderProps) => {
  const store = useRef<StoreApi<UserSettingsStore>>();
  if (!store.current) {
    store.current = createUserSettingsStore(initialState);
  }
  return (
    <UserSettingsContext.Provider value={store.current}>{children}</UserSettingsContext.Provider>
  );
};
