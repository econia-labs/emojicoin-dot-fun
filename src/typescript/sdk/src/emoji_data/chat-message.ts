import emojiRegex from "emoji-regex";
import { CHAT_EMOJI_DATA } from "./emoji-data";

export const toChatMessageEntryFunctionArgs = (message: string) => {
  const emojiArr = message.match(emojiRegex()) ?? [];
  const indices: Record<string, number> = {};
  const bytesArray: Uint8Array[] = [];
  const sequence: number[] = [];

  for (const emoji of emojiArr) {
    if (!CHAT_EMOJI_DATA.hasEmoji(emoji)) {
      console.warn(`Emoji ${emoji} not found in mapping. Ignoring it.`);
      continue;
    }
    if (indices[emoji] === undefined) {
      indices[emoji] = bytesArray.length;
      bytesArray.push(CHAT_EMOJI_DATA.byEmojiStrict(emoji).bytes);
    }
    sequence.push(indices[emoji]);
  }
  return { emojiBytes: bytesArray, emojiIndicesSequence: sequence };
};
