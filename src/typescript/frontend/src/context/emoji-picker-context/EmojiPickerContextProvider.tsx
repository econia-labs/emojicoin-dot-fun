"use client";

import { type ReactNode, createContext, useRef } from "react";
import { type StoreApi } from "zustand";
import { type EmojiPickerStore } from "@store/emoji-picker-store";
import createEmojiPickerStore from "@store/emoji-picker-store";

/**
 *
 * -------------------
 * Emoji Picker Context
 * -------------------
 *
 */
export const EmojiPickerContext = createContext<StoreApi<EmojiPickerStore> | null>(null);

export interface EmojiPickerProviderProps {
  children: ReactNode;
  initialState?: Partial<EmojiPickerStore>;
}

export const EmojiPickerProvider = ({ children, initialState }: EmojiPickerProviderProps) => {
  const store = useRef<StoreApi<EmojiPickerStore>>();
  if (!store.current) {
    store.current = createEmojiPickerStore(initialState);
  }
  return (
    <EmojiPickerContext.Provider value={store.current}>{children}</EmojiPickerContext.Provider>
  );
};
