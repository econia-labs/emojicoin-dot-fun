import { type EventStore } from "@store/event-store";
import { type WebSocketClientStore } from "@store/websocket-store";
import { useContext } from "react";
import { useStore } from "zustand";
import { UserSettingsContext, WebSocketEventContext } from "./StateStoreContextProviders";
import { type UserSettingsStore } from "@store/user-settings-store";

export const useEventStore = <T,>(selector: (store: EventStore) => T): T => {
  const eventStoreContext = useContext(WebSocketEventContext);

  if (eventStoreContext === null || eventStoreContext.events === null) {
    throw new Error("useEventStore must be used within a WebSocketContextProvider");
  }

  return useStore(eventStoreContext.events, selector);
};

export const useWebSocketClient = <T,>(selector: (store: WebSocketClientStore) => T): T => {
  const eventStoreContext = useContext(WebSocketEventContext);

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
