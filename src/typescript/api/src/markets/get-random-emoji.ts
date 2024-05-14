import { Hex } from "@aptos-labs/ts-sdk";

// If the `symbol_emojis.json` file is empty, please run:
//
//   cd <GIT_ROOT>/emojicoin/src/python/move_emojis
//   poetry install && poetry run python -m scripts.generate_code
//
// @ts-ignore
import emojiJsonData from "../../../../python/move_emojis/data/symbol_emojis.json";

/* eslint-disable-next-line import/no-unused-modules */
export type EmojiJSONData = {
  emoji: string;
  version: string;
  code_points: {
    num_bytes: number;
    as_unicode: Array<string>;
    as_hex: Array<string>;
  };
};

const EMOJI_JSON_DATA: Array<EmojiJSONData> = Object.keys(emojiJsonData).map(
  (k) => emojiJsonData[k as keyof typeof emojiJsonData]
);
const decoder = new TextDecoder("utf-8");

export const getRandomEmoji = (): {
  asActualEmoji: string;
  emojiBytes: Uint8Array;
} => {
  const randomIndex = Math.floor(EMOJI_JSON_DATA.length * Math.random());
  const randomEmoji = EMOJI_JSON_DATA[randomIndex];

  const emoji = randomEmoji.code_points.as_hex.join("");
  const emojiBytes = Hex.fromHexInput(emoji).toUint8Array();

  return {
    asActualEmoji: decoder.decode(emojiBytes),
    emojiBytes,
  };
};
