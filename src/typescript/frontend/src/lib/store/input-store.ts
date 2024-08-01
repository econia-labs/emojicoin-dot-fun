import { type SymbolEmojiData } from "@sdk/emoji_data";
import { create } from "zustand";

export type InputState = {
  mode: "chat" | "register" | "search";
  emojis: string[];
  pickerRef: HTMLDivElement | null;
  textAreaRef: HTMLTextAreaElement | null;
  chatEmojiData: Map<string, SymbolEmojiData>;
  onClickOutside: (e: MouseEvent) => void;
  pickerInvisible: boolean;
  isLoadingRegisteredMarket: boolean;
  /**
   * The most recently registered emojis' symbol data.
   * This is used to retrieve the most recently registered emojis without worrying about
   * the emojis being cleared from the input, since the `emojis` are cleared after the registration.
   * Note that we optimistically assume the response will be successful while the transaction is
   * pending in order to avoid re-renders during the animation orchestration. If it fails, we unset
   * this value, but for a period of time this may technically be an invalid set of emojis if the
   * transaction fails.
   */
  registeredSymbolData: Array<SymbolEmojiData>;
};

export type InputActions = {
  clear: () => void;
  setEmojis: (emojis: string[], selection?: { start: number; end?: number }) => void;
  setPickerRef: (value: HTMLDivElement | null) => void;
  setTextAreaRef: (value: HTMLTextAreaElement | null) => void;
  setMode: (mode: "chat" | "register" | "search") => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => void;
  setPickerInvisible: (value: boolean) => void;
  setRegisteredEmojis: (emojis: SymbolEmojiData[]) => void;
  setIsLoadingRegisteredMarket: (value: boolean) => void;
};

export type InputStore = InputState & InputActions;

const defaultValues: InputState = {
  mode: "register" as InputState["mode"],
  pickerInvisible: true,
  emojis: [],
  pickerRef: null,
  textAreaRef: null,
  chatEmojiData: new Map<string, SymbolEmojiData>(),
  registeredSymbolData: [],
  isLoadingRegisteredMarket: false,
  onClickOutside: (_e) => {},
};

export const useInputStore = create<InputStore>()((set, get) => ({
  ...defaultValues,
  setRegisteredEmojis: (emojis) => set({ registeredSymbolData: emojis }),
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
  setIsLoadingRegisteredMarket: (value) => set({ isLoadingRegisteredMarket: value }),
  setPickerRef: (value: HTMLDivElement | null) => set({ pickerRef: value }),
  setTextAreaRef: (value: HTMLTextAreaElement | null) => {
    return set({ textAreaRef: value });
  },
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => set({ chatEmojiData: value }),
}));

export default useInputStore;
