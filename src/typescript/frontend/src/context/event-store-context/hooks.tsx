import { useContext } from "react";
import { useStore } from "zustand";
import type { NameStore } from "@/store/name-store";
import { UserSettingsContext, EventStoreContext } from "./StateStoreContextProviders";
import { type UserSettingsStore } from "@/store/user-settings-store";
import { type WebSocketClientStore } from "@/store/websocket/store";
import { type EventStore } from "@/store/event/types";

export const useEventStore = <T,>(selector: (store: EventStore) => T): T => {
  const eventStoreContext = useContext(EventStoreContext);

  if (eventStoreContext === null || eventStoreContext.events === null) {
    throw new Error("useEventStore must be used within a WebSocketContextProvider");
  }

  return useStore(eventStoreContext.events, selector);
};

export const useNameStore = <T,>(selector: (store: NameStore) => T): T => {
  const nameStoreContext = useContext(EventStoreContext);

  if (nameStoreContext === null || nameStoreContext.events === null) {
    throw new Error("useNameStore must be used within a EventStoreProvider");
  }

  return useStore(nameStoreContext.names, selector);
};

export const useWebSocketClient = <T,>(selector: (store: WebSocketClientStore) => T): T => {
  const eventStoreContext = useContext(EventStoreContext);

  if (eventStoreContext === null || eventStoreContext.client === null) {
    throw new Error("useWebSocketStore must be used within a WebSocketContextProvider");
  }

  return useStore(eventStoreContext.client, selector);
};

export const useUserSettings = <T,>(selector: (store: UserSettingsStore) => T): T => {
  const userSettingsContext = useContext(UserSettingsContext);

  if (userSettingsContext === null) {
    throw new Error("useWebSocketStore must be used within a UserSettingsProvider");
  }

  return useStore(userSettingsContext, selector);
};
