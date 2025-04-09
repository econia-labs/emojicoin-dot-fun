// cspell:ignore noto

import { SYMBOL_EMOJIS } from "@/sdk/index";

import appleEmojiColorData from "../../src/lib/utils/emojiColors/symbol-emojis/apple-symbol-emoji-colors";
import notoEmojiColorData from "../../src/lib/utils/emojiColors/symbol-emojis/noto-symbol-emoji-colors";

describe("Check if we have a color defined for every emoji", () => {
  it("has a color for every apple emoji symbol", () => {
    expect(Object.keys(appleEmojiColorData).length).toEqual(Object.keys(SYMBOL_EMOJIS).length);
    Object.values(appleEmojiColorData).forEach((color) => {
      expect(color).not.toEqual("000000");
    });
  });
  it("has a color for every noto emoji symbol", () => {
    expect(Object.keys(notoEmojiColorData).length).toEqual(Object.keys(SYMBOL_EMOJIS).length);
    Object.values(notoEmojiColorData).forEach((color) => {
      expect(color).not.toEqual("000000");
    });
  });
});
