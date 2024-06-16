export type EmojiPickerSelection = {
  /**
   * @link https://www.w3.org/TR/uievents-key/#named-key-attribute-values
   */
  key: string;
  emojis: string[];
  target: HTMLTextAreaElement;
};

/**
 *  This function encapsulates the logic for interacting with the current text input related to the
 *  emoji picker.
 *
 *  Map emojis to indices:
 *  1. If the selectionStart !== selectionEnd, you delete the selection regardless of whether or
 *     not it's a delete or a backspace. The resulting cursor position is the selectionStart.
 *  2. If the selectionStart === selectionEnd, remove the emoji to the left if it's a backspace.
 *  3. If the selectionStart === selectionEnd, remove the emoji to the right if it's a delete.
 * @param param0
 * @returns
 */
export const handleEmojiPickerInput = ({
  key,
  emojis,
  target,
}: EmojiPickerSelection): {
  newEmojis: string[];
  newSelectionStart: number;
} => {
  // Convert cursor position to emoji index by accumulating the total # of bytes at each position.
  // For example, if we have three emojis, respectively 2, 3, and 4 bytes long, then indices is:
  // [0, 2, 5, 9]
  const indices = emojis.reduce(
    (acc, emoji) => {
      acc.push(acc[acc.length - 1] + emoji.length);
      return acc;
    },
    [0]
  );
  let emojiSelectionStart = indices.findIndex(
    (characterIndex) => characterIndex >= target.selectionStart
  );
  let emojiSelectionEnd = indices.findIndex(
    (characterIndex) => characterIndex >= target.selectionEnd
  );

  // If the user hits backspace or delete without selecting anything, we "pretend" the user has
  // selected at least one emoji by moving the starting point backwards if they hit backspace
  // and forwards if they hit delete. We restrict each value to be between 0 and the max length.
  if (emojiSelectionStart === emojiSelectionEnd) {
    if (key === "Backspace") {
      emojiSelectionStart = Math.max(0, emojiSelectionStart - 1);
    } else {
      emojiSelectionEnd = Math.min(emojis.length, emojiSelectionEnd + 1);
    }
  }

  const backspaceAtStart =
    emojiSelectionStart === 0 && emojiSelectionEnd === 0 && key === "Backspace";
  const deleteAtEnd =
    emojiSelectionStart === emojis.length &&
    emojiSelectionEnd === emojis.length &&
    key === "Delete";

  // If the user backspaces at the beginning or deletes at the end, we don't do anything.
  if (backspaceAtStart || deleteAtEnd) {
    return {
      newEmojis: emojis,
      newSelectionStart: target.selectionStart,
    };
  }

  // Convert the emoji indices back to character indices.
  const newSelectionStart = indices[emojiSelectionStart];

  // Remove the emojis from the selection start to the selection end.
  const newEmojis = emojis.slice(0, emojiSelectionStart).concat(emojis.slice(emojiSelectionEnd));

  return {
    newEmojis,
    newSelectionStart,
  };
};
