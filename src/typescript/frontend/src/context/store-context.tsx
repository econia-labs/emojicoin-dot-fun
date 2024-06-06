"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

import { type EventStore, createEventStore } from "@store/event-store";

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
