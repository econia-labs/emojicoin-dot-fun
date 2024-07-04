import { type SymbolEmojiData } from "@sdk/emoji_data";
import { create } from "zustand";

export type InputState = {
  mode: "chat" | "register";
  emojis: string[];
  picker: HTMLDivElement | null;
  chatEmojiData: Map<string, SymbolEmojiData>;
  onClickOutside: (e: MouseEvent) => void;
};

export type InputActions = {
  clear: () => void;
  pushEmojis: (emoji: string) => void;
  setEmojis: (emojis: string[]) => void;
  setPicker: (value: HTMLDivElement | null) => void;
  setMode: (mode: "chat" | "register") => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => void;
};

export type InputStore = InputState & InputActions;

const defaultValues = {
  mode: "register" as InputState["mode"],
  emojis: [],
  picker: null,
  chatEmojiData: new Map<string, SymbolEmojiData>(),
  onClickOutside: (_e) => {},
};

export const useInputStore = create<InputStore>()((set) => ({
  ...defaultValues,
  setOnClickOutside: (value: (e: MouseEvent) => void) => set({ onClickOutside: value }),
  setMode: (value) => set({ mode: value }),
  pushEmojis: (value: string) => set((state) => ({ emojis: [...state.emojis, value] })),
  setEmojis: (value: string[]) => set({ emojis: value }),
  clear: () => set({ emojis: [] }),
  setPicker: (value: HTMLDivElement | null) => set({ picker: value }),
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => set({ chatEmojiData: value }),
}));

export default useInputStore;
