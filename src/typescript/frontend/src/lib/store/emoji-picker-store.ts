import { type SymbolEmojiData } from "@sdk/emoji_data";
import { createStore } from "zustand";
import { insertEmojiTextInputHelper, removeEmojiTextInputHelper } from "./emoji-picker-utils";

export type EmojiPickerState = {
  mode: "chat" | "register" | "pools" | "home";
  emojis: string[];
  nativePicker: boolean;
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

export type EmojiPickerActions = {
  clear: () => void;
  setEmojis: (emojis: string[]) => void;
  setNativePicker: (value: boolean) => void;
  setPickerRef: (value: HTMLDivElement | null) => void;
  setTextAreaRef: (value: HTMLTextAreaElement | null) => void;
  setMode: (mode: "chat" | "register" | "pools" | "home") => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
  setChatEmojiData: (value: Map<string, SymbolEmojiData>) => void;
  setPickerInvisible: (value: boolean) => void;
  setRegisteredEmojis: (emojis: SymbolEmojiData[]) => void;
  setIsLoadingRegisteredMarket: (value: boolean) => void;
  insertEmojiTextInput: (textToInsert: string | string[]) => void;
  removeEmojiTextInput: (key?: string) => void;
};

export type EmojiPickerStore = EmojiPickerState & EmojiPickerActions;

const defaultValues: EmojiPickerState = {
  mode: "register" as EmojiPickerState["mode"],
  nativePicker: false,
  pickerInvisible: true,
  emojis: [],
  pickerRef: null,
  textAreaRef: null,
  chatEmojiData: new Map<string, SymbolEmojiData>(),
  registeredSymbolData: [],
  isLoadingRegisteredMarket: false,
  onClickOutside: (_e) => {},
};

export const setInputHelper = ({
  textAreaRef,
  emojis,
  selectionStart,
  selectionEnd,
}: {
  textAreaRef: HTMLTextAreaElement | null;
  emojis: string[];
  selectionStart?: number;
  selectionEnd?: number;
}) => {
  if (textAreaRef) {
    textAreaRef.value = emojis.join("");
    if (selectionStart) {
      textAreaRef.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
    }
    textAreaRef.focus();
    setTimeout(() => {
      textAreaRef.value = emojis.join("");
      if (selectionStart) {
        textAreaRef.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
      }
      textAreaRef.focus();
    }, 0);
  }
  return {
    emojis,
  };
};

export const createEmojiPickerStore = (initial?: Partial<EmojiPickerState>) =>
  createStore<EmojiPickerStore>()((set, get) => ({
    ...defaultValues,
    ...initial,
    setNativePicker: (value) => set({ nativePicker: value }),
    insertEmojiTextInput: (textToInsert) => {
      const res = insertEmojiTextInputHelper(get(), textToInsert);
      if (!res) return;
      return set(() => setInputHelper(res));
    },
    removeEmojiTextInput: (key) => {
      const res = removeEmojiTextInputHelper(get(), key);
      if (!res) return;
      return set(() => setInputHelper(res));
    },
    setRegisteredEmojis: (emojis) => set({ registeredSymbolData: emojis }),
    setPickerInvisible: (value) => set({ pickerInvisible: value }),
    setOnClickOutside: (value: (e: MouseEvent) => void) => set({ onClickOutside: value }),
    setMode: (value) => set({ mode: value }),
    setEmojis: (emojis) => {
      return set((state) => setInputHelper({ textAreaRef: state.textAreaRef, emojis }));
    },
    clear: () => {
      return set((state) =>
        setInputHelper({
          textAreaRef: state.textAreaRef,
          emojis: [],
          selectionStart: 0,
          selectionEnd: 0,
        })
      );
    },
    setIsLoadingRegisteredMarket: (value) => set({ isLoadingRegisteredMarket: value }),
    setPickerRef: (value: HTMLDivElement | null) => set({ pickerRef: value }),
    setTextAreaRef: (value: HTMLTextAreaElement | null) => {
      return set({ textAreaRef: value });
    },
    setChatEmojiData: (value: Map<string, SymbolEmojiData>) => set({ chatEmojiData: value }),
  }));

export default createEmojiPickerStore;
