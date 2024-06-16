import { type SymbolEmojiData } from "@sdk/emoji_data";
import { create } from "zustand";

export type InputStore = {
  mode: "chat" | "register";
  setMode: (mode: "chat" | "register") => void;
  emojis: string[];
  setEmojis: (emojis: string[]) => void;
  pushEmojis: (emoji: string) => void;
  clear: () => void;
  picker: HTMLDivElement | null;
  setPicker: (value: HTMLDivElement | null) => void;
  chatEmojiData: Map<string, SymbolEmojiData>;
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => void;
  onClickOutside: (e: MouseEvent) => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
};

export const useInputStore = create<InputStore>()((set) => ({
  onClickOutside: (_e) => {},
  setOnClickOutside: (value: (e: MouseEvent) => void) => set({ onClickOutside: value }),
  mode: "register",
  setMode: (value) => set({ mode: value }),
  emojis: [],
  picker: null,
  pushEmojis: (value: string) => set((state) => ({ emojis: [...state.emojis, value] })),
  setEmojis: (value: string[]) => set({ emojis: value }),
  clear: () => set({ emojis: [] }),
  setPicker: (value: HTMLDivElement | null) => set({ picker: value }),
  chatEmojiData: new Map<string, SymbolEmojiData>(),
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => set({ chatEmojiData: value }),
}));

export default useInputStore;
