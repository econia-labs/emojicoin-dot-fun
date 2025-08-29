import { useContext } from "react";
import { useStore } from "zustand";

import { createEventStore } from "@/store/event/event-store";
import type { EventAndClientStore } from "@/store/event/types";
import { createNameStore, type NameStore } from "@/store/name-store";
import type { UserSettingsStore } from "@/store/user-settings-store";

import { UserSettingsContext } from "./StateStoreContextProviders";

export const useUserSettings = <T,>(selector: (store: UserSettingsStore) => T): T => {
  const userSettingsContext = useContext(UserSettingsContext);

  if (userSettingsContext === null) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }

  return useStore(userSettingsContext, selector);
};

export const globalNameStore = createNameStore();
let globalEventStore: ReturnType<typeof createEventStore>;

// Create a singleton with checks to ensure that this isn't created at runtime during the prebuild scripts, since this
// is a top-level call and the `createWebSocketClientStore` call inside `createEventStore` tries to connect to wss.
const getGlobalEventStoreSingleton = () => {
  if (!globalEventStore) {
    globalEventStore = createEventStore();
  }
  return globalEventStore;
};

export const useNameStore = <T,>(selector: (store: NameStore) => T): T =>
  useStore(globalNameStore, selector);

export const useEventStore = <T,>(selector: (store: EventAndClientStore) => T): T =>
  useStore(getGlobalEventStoreSingleton(), selector);
