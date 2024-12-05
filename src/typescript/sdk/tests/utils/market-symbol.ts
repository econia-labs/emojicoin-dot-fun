import { MAX_SYMBOL_LENGTH, getEmojisInString, isValidEmoji } from "../../src";

/**
 * This parses an input string to see if it's a valid symbol.
 * It not only checks that each individual emoji is valid, but also that the total number
 * of bytes is valid as well.
 * @param symbol the symbol to be checked.
 * @returns whether or not the symbol is a valid symbol.
 *
 * @example
 * ```typescript
 * isValidSymbol('🟥🟥'); // true
 * isValidSymbol('🟥🟥🟥🟥🟥'); // false (too long)
 * ```
 */
export const isValidMarketSymbol = (symbol: string): boolean => {
  const numBytes = new TextEncoder().encode(symbol).length;
  if (numBytes > MAX_SYMBOL_LENGTH || numBytes === 0) {
    return false;
  }
  const emojis = getEmojisInString(symbol);
  const reconstructed = Array.from(emojis).join("");
  if (reconstructed !== symbol) {
    return false;
  }
  for (const emoji of emojis) {
    if (!isValidEmoji(emoji)) {
      return false;
    }
  }
  return true;
};
