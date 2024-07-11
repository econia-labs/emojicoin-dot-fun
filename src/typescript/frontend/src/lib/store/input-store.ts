import { type SymbolEmojiData } from "@sdk/emoji_data";
import { create } from "zustand";

export type InputState = {
  mode: "chat" | "register" | "pools";
  emojis: string[];
  pickerRef: HTMLDivElement | null;
  textAreaRef: HTMLTextAreaElement | null;
  chatEmojiData: Map<string, SymbolEmojiData>;
  onClickOutside: (e: MouseEvent) => void;
  pickerInvisible: boolean;
};

export type InputActions = {
  clear: () => void;
  setEmojis: (emojis: string[], selection?: { start: number; end?: number }) => void;
  setPickerRef: (value: HTMLDivElement | null) => void;
  setTextAreaRef: (value: HTMLTextAreaElement | null) => void;
  setMode: (mode: "chat" | "register" | "pools") => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => void;
  setPickerInvisible: (value: boolean) => void;
};

export type InputStore = InputState & InputActions;

const defaultValues: InputState = {
  mode: "register" as InputState["mode"],
  pickerInvisible: true,
  emojis: [],
  pickerRef: null,
  textAreaRef: null,
  chatEmojiData: new Map<string, SymbolEmojiData>(),
  onClickOutside: (_e) => {},
};

export const useInputStore = create<InputStore>()((set, get) => ({
  ...defaultValues,
  setPickerInvisible: (value) => set({ pickerInvisible: value }),
  setOnClickOutside: (value: (e: MouseEvent) => void) => set({ onClickOutside: value }),
  setMode: (value) => set({ mode: value }),
  setEmojis: (emojis, selection) => {
    const textAreaRef = get().textAreaRef;
    if (textAreaRef) {
      textAreaRef.value = emojis.join("");
      if (selection) {
        const start = selection.start;
        const end = selection.end ?? selection.start;
        textAreaRef.setSelectionRange(start, end);
        // Ensure the cursor is placed at the correct position if React hasn't updated the DOM yet.
        setTimeout(() => {
          textAreaRef.setSelectionRange(start, end);
        }, 0);
      }
    }
    return set({ emojis });
  },
  clear: () => {
    const textAreaRef = get().textAreaRef;
    if (textAreaRef) {
      textAreaRef.value = "";
      textAreaRef.setSelectionRange(0, 0);
    }
    return set({ emojis: [] });
  },
  setPickerRef: (value: HTMLDivElement | null) => set({ pickerRef: value }),
  setTextAreaRef: (value: HTMLTextAreaElement | null) => {
    return set({ textAreaRef: value });
  },
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => set({ chatEmojiData: value }),
}));

export default useInputStore;
