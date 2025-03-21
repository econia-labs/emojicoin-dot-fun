"use client";

import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";

import createUserSettingsStore, { type UserSettingsStore } from "@/store/user-settings-store";

/**
 *
 * ---------------------
 * User Settings Context
 * ---------------------
 *
 */
export const UserSettingsContext = createContext<StoreApi<UserSettingsStore> | null>(null);

interface UserSettingsProviderProps {
  userAgent: string;
  children: ReactNode;
}

export const UserSettingsProvider = ({ userAgent, children }: UserSettingsProviderProps) => {
  const store = useRef<StoreApi<UserSettingsStore>>();
  if (!store.current) {
    store.current = createUserSettingsStore(userAgent);
  }
  return (
    <UserSettingsContext.Provider value={store.current}>{children}</UserSettingsContext.Provider>
  );
};
