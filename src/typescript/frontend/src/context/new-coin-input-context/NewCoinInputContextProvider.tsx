"use client";

import { type ReactNode, createContext, useRef } from "react";
import { type StoreApi } from "zustand";
import createNewCoinInputStore, { type NewCoinInputStore } from "@/store/new-coin-input-store";

/**
 *
 * -------------------
 * Emoji Picker Context
 * -------------------
 *
 */
export const NewCoinInputContext = createContext<StoreApi<NewCoinInputStore> | null>(null);

export interface NewCoinInputProps {
  children: ReactNode;
  initialState?: Partial<NewCoinInputStore>;
}

export const NewCoinInputProvider = ({ children, initialState }: NewCoinInputProps) => {
  const store = useRef<StoreApi<NewCoinInputStore>>();
  if (!store.current) {
    store.current = createNewCoinInputStore(initialState);
  }
  return (
    <NewCoinInputContext.Provider value={store.current}>{children}</NewCoinInputContext.Provider>
  );
};
