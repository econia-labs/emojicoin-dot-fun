import emojiRegex from "emoji-regex";
import {
  CHAT_EMOJI_DATA,
  isSymbolEmoji,
  isValidChatMessageEmoji,
  SYMBOL_EMOJI_DATA,
} from "./emoji-data";

export const toChatMessageEntryFunctionArgs = (message: string) => {
  const emojiArr = message.match(emojiRegex()) ?? [];
  const indices: Record<string, number> = {};
  const bytesArray: Uint8Array[] = [];
  const sequence: number[] = [];

  for (const emoji of emojiArr) {
    if (!isValidChatMessageEmoji(emoji)) {
      console.warn(`Emoji ${emoji} not found in mapping. Ignoring it.`);
      continue;
    }
    if (indices[emoji] === undefined) {
      indices[emoji] = bytesArray.length;
      if (isSymbolEmoji(emoji)) {
        bytesArray.push(SYMBOL_EMOJI_DATA.byEmojiStrict(emoji).bytes);
      } else {
        bytesArray.push(CHAT_EMOJI_DATA.byEmojiStrict(emoji).bytes);
      }
    }
    sequence.push(indices[emoji]);
  }
  return {
    emojiBytes: bytesArray,
    emojiIndicesSequence: new Uint8Array(sequence),
  };
};
