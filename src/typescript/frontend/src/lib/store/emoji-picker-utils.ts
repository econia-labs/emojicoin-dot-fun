import { type EmojiPickerStore } from "./emoji-picker-store";
import { getEmojisInString, isSymbolEmoji, isValidChatMessageEmoji } from "@sdk/emoji_data";

export const calculateEmojiIndices = (emojis: string[]) => {
  return emojis.reduce(
    (acc, emoji) => {
      acc.push(acc[acc.length - 1] + emoji.length);
      return acc;
    },
    [0]
  );
};

// Convert cursor position to emoji index by accumulating the total # of bytes at each position.
// For example, if we have three emojis, respectively 2, 3, and 4 bytes long, then indices is:
// [0, 2, 5, 9]
export const calculateIndicesFromSelection = (
  emojis: string[],
  selectionStart: number,
  selectionEnd: number
) => {
  const indices = calculateEmojiIndices(emojis);
  return {
    indices,
    start: indices.findIndex((characterIndex) => characterIndex >= selectionStart),
    end: indices.findIndex((characterIndex) => characterIndex >= selectionEnd),
  };
};

export const insertEmojiTextInputHelper = (
  state: EmojiPickerStore,
  textToInsert: string | string[]
) => {
  const { mode, emojis, textAreaRef: target } = state;

  if (!target) return;
  const parsedEmojis = Array.isArray(textToInsert) ? textToInsert : getEmojisInString(textToInsert);
  const filteredEmojis =
    mode === "chat"
      ? parsedEmojis.filter(isValidChatMessageEmoji)
      : parsedEmojis.filter(isSymbolEmoji);
  if (filteredEmojis.length === 0) return;

  const { start, end } = calculateIndicesFromSelection(
    emojis,
    target.selectionStart,
    target.selectionEnd
  );

  // prettier-ignore
  const newEmojis = (emojis as Array<string>)
    .slice(0, start)
    .concat(filteredEmojis)
    .concat(emojis.slice(end));

  // Rename these variables for clarity and readability.
  const initialEnd = end;
  const numSelectedEmojis = end - start;

  // If nothing is selected, `numSelectedEmojis` will be 0, and thus the logic for
  // inserting when nothing is selected and when something is selected is functionally the same.
  const newEmojiEnd = initialEnd + filteredEmojis.length - numSelectedEmojis;

  // Find the new selection start based on the new indices.
  const indices = calculateEmojiIndices(newEmojis);
  const newSelectionEnd = indices[newEmojiEnd];

  return {
    textAreaRef: target,
    emojis: newEmojis,
    selectionStart: newSelectionEnd,
  };
};

/**
 *  This function encapsulates the logic for removing emojis from the input field with backspace,
 *  delete, or general selection removal like the cut command (ctrl/cmd + X).
 *
 *  Map emojis to indices:
 *  1. If the selectionStart !== selectionEnd, you delete the selection regardless of whether or
 *     not it's a delete or a backspace. The resulting cursor position is the selectionStart.
 *  2. If the selectionStart === selectionEnd, remove the emoji to the left if it's a backspace.
 *  3. If the selectionStart === selectionEnd, remove the emoji to the right if it's a delete.
 */
export const removeEmojiTextInputHelper = (state: EmojiPickerStore, key?: string) => {
  const { emojis, textAreaRef: target } = state;

  if (!target) return;

  const { indices, start, end } = calculateIndicesFromSelection(
    emojis,
    target.selectionStart,
    target.selectionEnd
  );

  let emojiSelectionStart = start;
  let emojiSelectionEnd = end;

  // If the user hits backspace or delete without selecting anything, we "pretend" the user has
  // selected at least one emoji by moving the starting point backwards if they hit backspace
  // and forwards if they hit delete. We restrict each value to be between 0 and the max length.
  if (emojiSelectionStart === emojiSelectionEnd) {
    if (key === "Backspace") {
      emojiSelectionStart = Math.max(0, emojiSelectionStart - 1);
    } else if (key === "Delete") {
      emojiSelectionEnd = Math.min(emojis.length, emojiSelectionEnd + 1);
    } else {
      // Return early because only backspace and delete remove emojis if there is nothing selected.
      return;
    }
  }

  const backspaceAtStart =
    emojiSelectionStart === 0 && emojiSelectionEnd === 0 && key === "Backspace";
  const deleteAtEnd =
    emojiSelectionStart === emojis.length &&
    emojiSelectionEnd === emojis.length &&
    key === "Delete";

  // If the user backspaces at the beginning or deletes at the end, we don't do anything.
  if (backspaceAtStart || deleteAtEnd) return;

  // Convert the emoji indices back to character indices.
  const newSelectionStart = indices[emojiSelectionStart];

  // Remove the emojis from the selection start to the selection end.
  const newEmojis = emojis.slice(0, emojiSelectionStart).concat(emojis.slice(emojiSelectionEnd));

  return {
    textAreaRef: target,
    emojis: newEmojis,
    selectionStart: newSelectionStart,
  };
};
