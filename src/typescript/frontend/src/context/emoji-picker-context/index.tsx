import { useContext } from "react";
import { useStore } from "zustand";

import type { EmojiPickerStore } from "@/store/emoji-picker-store";

import { EmojiPickerContext } from "./EmojiPickerContextProvider";

export const useEmojiPicker = <T,>(selector: (store: EmojiPickerStore) => T): T => {
  const emojiPickerContext = useContext(EmojiPickerContext);

  if (emojiPickerContext === null) {
    throw new Error("useEmojiPicker must be used within a EmojiPickerProvider");
  }

  return useStore(emojiPickerContext, selector);
};
