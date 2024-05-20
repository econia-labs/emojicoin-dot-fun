import { Hex } from "@aptos-labs/ts-sdk";
import SymbolEmojis from "./symbol-emojis.json";

const SYMBOL_EMOJI_KEYS = Object.keys(SymbolEmojis);

export const getRandomEmoji = (): {
  emoji: string;
  emojiBytes: Uint8Array;
} => {
  const randomIndex = Math.floor(SYMBOL_EMOJI_KEYS.length * Math.random());
  const randomName = SYMBOL_EMOJI_KEYS[randomIndex] as keyof typeof SymbolEmojis;
  const randomEmoji = SymbolEmojis[randomName];
  const emojiBytes = Hex.fromHexInput(randomEmoji.hex).toUint8Array();

  return {
    emoji: randomEmoji.emoji,
    emojiBytes,
  };
};

export type SymbolEmojiWithName = (typeof SymbolEmojis)["Aquarius"] & {
  name: string;
};
const symbolDataByName: Map<string, SymbolEmojiWithName> = new Map();
const symbolDataByHexBytes: Map<`0x${string}`, SymbolEmojiWithName> = new Map();

SYMBOL_EMOJI_KEYS.forEach((k) => {
  const key = k as keyof typeof SymbolEmojis;
  symbolDataByName.set(key, {
    ...SymbolEmojis[key],
    name: key,
  });
  symbolDataByHexBytes.set(`0x${SymbolEmojis[key].hex}`, {
    ...SymbolEmojis[key],
    name: key,
  });
});

export const getEmojiDataByName = (emojiName: keyof typeof SymbolEmojis): SymbolEmojiWithName => {
  return symbolDataByName.get(emojiName)!;
}

export const getEmojiData = (emojiHexBytes: `0x${string}`): SymbolEmojiWithName | undefined => {
  // TODO: Remove this once we have a proper type guard for HexInput.
  const bytes = `0x${Hex.fromHexInput(emojiHexBytes).toString()}` as const;
  return symbolDataByHexBytes.get(bytes);
};


/**
 * 
 * @param symbol An emoji to check if it is a valid symbol.
 * @returns whether or not the symbol is a valid emoji.
 * 
 * @example
 * ```typescript
 * isValidSymbol('🟥'); // true
 * ```
 */
export const isValidSymbol = (symbol: string): boolean => {
  return symbolDataByName.has(symbol);
}

/**
 * 
 * @param symbolHex A hex string or Uint8Array to check if the passed in hex string bytes are a
 * valid emoji symbol.
 * @returns whether or not the symbol is a valid emoji.
 * 
 * @example
 * ```typescript
 * isValidSymbolHex('0xf09f9fa5'); // true
 * isValidSymbolHex(new Uint8Array([ 240, 159, 159, 165 ])); // true
 * ```
 */
export const isValidSymbolHex = (symbolHex: `0x${string}` | Uint8Array): boolean => {
  if (typeof symbolHex === 'string') {
    return symbolDataByHexBytes.has(symbolHex);
  }
  return symbolDataByHexBytes.has(`0x${Hex.fromHexInput(symbolHex).toString()}`);
}
