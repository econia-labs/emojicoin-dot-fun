import { type SymbolEmojiData } from "@sdk/emoji_data";

/**
 * Converts an array of SymbolEmojiData to a string of names.
 * @param emojis
 * @returns {string}
 */
export const emojisToName = (emojis: Array<SymbolEmojiData>): string => {
  return emojis.map((emoji) => emoji.name).join(",");
};
