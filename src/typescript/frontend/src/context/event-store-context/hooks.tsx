import { useContext } from "react";
import { useStore } from "zustand";
import { createNameStore, type NameStore } from "@/store/name-store";
import { UserSettingsContext } from "./StateStoreContextProviders";
import { type UserSettingsStore } from "@/store/user-settings-store";
import { type EventAndClientStore } from "@/store/event/types";
import { createEventStore } from "@/store/event/event-store";

export const useUserSettings = <T,>(selector: (store: UserSettingsStore) => T): T => {
  const userSettingsContext = useContext(UserSettingsContext);

  if (userSettingsContext === null) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }

  return useStore(userSettingsContext, selector);
};

export const globalNameStore = createNameStore();
export const globalEventStore = createEventStore();

export const useNameStore = <T,>(selector: (store: NameStore) => T): T =>
  useStore(globalNameStore, selector);

export const useEventStore = <T,>(selector: (store: EventAndClientStore) => T): T =>
  useStore(globalEventStore, selector);
