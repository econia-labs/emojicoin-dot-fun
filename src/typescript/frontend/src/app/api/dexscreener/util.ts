import { type SymbolEmoji, toMarketEmojiData } from "@sdk/emoji_data";

export function pairIdToSymbolEmojiString(pairId: string): string {
  return pairId.split("-")[0];
}

export function symbolEmojisToString(symbolEmojis: Array<SymbolEmoji>): string {
  return symbolEmojis.join("");
}

export function symbolEmojiStringToArray(symbolEmojiString: string): SymbolEmoji[] {
  const marketEmojiData = toMarketEmojiData(symbolEmojiString);
  return marketEmojiData.emojis.map((emojiData) => emojiData.emoji);
}

export function pairIdToSymbolEmojis(pairId: string): SymbolEmoji[] {
  const emojiString = pairIdToSymbolEmojiString(pairId);
  return symbolEmojiStringToArray(emojiString);
}

export function symbolEmojisToPairId(symbolEmojis: Array<SymbolEmoji>): string {
  return symbolEmojisToString(symbolEmojis) + "-APT";
}
