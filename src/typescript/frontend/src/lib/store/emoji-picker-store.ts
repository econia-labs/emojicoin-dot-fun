import { type SymbolEmojiData } from "@sdk/emoji_data";
import { createStore } from "zustand";
import { insertEmojiTextInputHelper, removeEmojiTextInputHelper } from "./emoji-picker-utils";

export type EmojiPickerState = {
  mode: "chat" | "register" | "search";
  emojis: string[];
  nativePicker: boolean;
  pickerRef: HTMLDivElement | null;
  textAreaRef: HTMLTextAreaElement | null;
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
  setMode: (mode: "chat" | "register" | "search") => void;
  setOnClickOutside: (value: (e: MouseEvent) => void) => void;
  setPickerInvisible: (value: boolean) => void;
  setRegisteredEmojis: (emojis: SymbolEmojiData[]) => void;
  setIsLoadingRegisteredMarket: (value: boolean) => void;
  insertEmojiTextInput: (textToInsert: string | string[]) => void;
  removeEmojiTextInput: (key?: string) => void;
  getEmojis: () => string[];
};

export type EmojiPickerStore = EmojiPickerState & EmojiPickerActions;

const defaultValues: EmojiPickerState = {
  mode: "register" as EmojiPickerState["mode"],
  nativePicker: false,
  pickerInvisible: true,
  emojis: [],
  pickerRef: null,
  textAreaRef: null,
  registeredSymbolData: [],
  isLoadingRegisteredMarket: false,
  onClickOutside: (_e) => {},
};

export const setInputHelper = ({
  textAreaRef,
  emojis,
  selectionStart,
  selectionEnd,
  shouldFocus,
}: {
  textAreaRef: HTMLTextAreaElement | null;
  emojis: string[];
  selectionStart?: number;
  selectionEnd?: number;
  shouldFocus?: boolean;
}) => {
  const updateThings = (textArea: HTMLTextAreaElement) => {
    textArea.value = emojis.join("");
    if (selectionStart) {
      textArea.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
    }
    if (shouldFocus === true) {
      textArea.focus();
    }
  };

  if (textAreaRef) {
    updateThings(textAreaRef);
    // Call this twice so the DOM is for sure updated. Without this, the selectionStart and
    // selectionEnd are not updated properly.
    setTimeout(() => {
      updateThings(textAreaRef);
    }, 0);
  }
  if (shouldFocus) {
    return {
      emojis,
      pickerInvisible: false,
    };
  }
  return {
    emojis,
  };
};

export const createEmojiPickerStore = (initial?: Partial<EmojiPickerState>) =>
  createStore<EmojiPickerStore>()((set, get) => ({
    ...defaultValues,
    ...initial,
    getEmojis: () => get().emojis,
    setNativePicker: (value) => set({ nativePicker: value }),
    insertEmojiTextInput: (textToInsert) => {
      const inputs = insertEmojiTextInputHelper(get(), textToInsert);
      if (!inputs) return;
      return set(() =>
        setInputHelper({
          ...inputs,
          shouldFocus: true,
        })
      );
    },
    removeEmojiTextInput: (key) => {
      const inputs = removeEmojiTextInputHelper(get(), key);
      if (!inputs) return;
      return set(() =>
        setInputHelper({
          ...inputs,
          shouldFocus: true,
        })
      );
    },
    setRegisteredEmojis: (emojis) => set({ registeredSymbolData: emojis }),
    setPickerInvisible: (value) => {
      // Explicitly needs to be a boolean to avoid eventHandlers that pass their event inadvertently
      // passing truthy values.
      const invisible = value === true;
      if (invisible) {
        get().textAreaRef?.blur();
      } else {
        get().textAreaRef?.focus();
      }
      set({ pickerInvisible: value });
    },
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
    setTextAreaRef: (textAreaRef: HTMLTextAreaElement | null) => {
      // Reload the text area with the current emojis.
      if (textAreaRef) {
        textAreaRef.value = get().emojis.join("");
        if (get().pickerInvisible === false) {
          textAreaRef.focus();
        }
      }
      return set({ textAreaRef });
    },
  }));

export default createEmojiPickerStore;
