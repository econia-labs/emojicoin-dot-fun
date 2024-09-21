"use client";

import { type ReactNode, createContext, useRef } from "react";
import { type StoreApi } from "zustand";
import { type NameStore, createNameStore } from "@/store/name-store";
import createUserSettingsStore, { type UserSettingsStore } from "@/store/user-settings-store";
import { createEventStore } from "@/store/event/event-store";
import { type EventStore } from "@/store/event/types";
import { createWebSocketClientStore, type WebSocketClientStore } from "@/store/websocket/store";

/**
 *
 * -------------------
 * Event Store Context
 * -------------------
 *
 */

export const EventStoreContext = createContext<{
  events: StoreApi<EventStore>;
  names: StoreApi<NameStore>;
  client: StoreApi<WebSocketClientStore>;
} | null>(null);

export interface EventStoreProviderProps {
  children: ReactNode;
}

const createStores = () => {
  const events = createEventStore();
  return {
    events,
    names: createNameStore(),
    client: createWebSocketClientStore(events),
  };
};

export const EventStoreProvider = ({ children }: EventStoreProviderProps) => {
  const stores = useRef(createStores());
  return <EventStoreContext.Provider value={stores.current}>{children}</EventStoreContext.Provider>;
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
