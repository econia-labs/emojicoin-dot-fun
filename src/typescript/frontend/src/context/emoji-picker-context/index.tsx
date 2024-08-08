import { useContext } from "react";
import { useStore } from "zustand";
import { EmojiPickerContext } from "./EmojiPickerContextProvider";
import { type EmojiPickerStore } from "@store/emoji-picker-store";

export const useEmojiPicker = <T,>(selector: (store: EmojiPickerStore) => T): T => {
  const emojiPickerContext = useContext(EmojiPickerContext);

  if (emojiPickerContext === null) {
    throw new Error("useEmojiPicker must be used within a EmojiPickerProvider");
  }

  return useStore(emojiPickerContext, selector);
};
