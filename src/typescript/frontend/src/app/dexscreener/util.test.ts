// cspell:word dexscreener
import type { SymbolEmoji } from "@sdk/emoji_data";
import { describe, it } from "node:test";
import { pairIdToSymbolEmojis, symbolEmojisToPairId, symbolEmojisToString } from "./util";
import { expect } from "@playwright/test";

describe("dexscreener utilities", () => {
  const marketSymbols: SymbolEmoji[][] = [["🤌"], ["🤌🏻", "🤌🏽"], ["🤌🏼", "🤌🏾", "🤌🏿"]];

  it("ensures ID stability across different endpoints", async () => {
    const expectedJoinedStrings = ["🤌", "🤌🏻🤌🏽", "🤌🏼🤌🏾🤌🏿"];
    const expectedPairIds = ["🤌-APT", "🤌🏻🤌🏽-APT", "🤌🏼🤌🏾🤌🏿-APT"];

    for (let i = 0; i < marketSymbols.length; i++) {
      const symbolEmojis = marketSymbols[i];

      const joinedSymbolEmojis = symbolEmojisToString(symbolEmojis);
      expect(joinedSymbolEmojis).toEqual(expectedJoinedStrings[i]);

      const pairId = symbolEmojisToPairId(symbolEmojis);
      expect(pairId).toEqual(expectedPairIds[i]);

      const deserializedSymbolEmojis = pairIdToSymbolEmojis(pairId);
      expect(deserializedSymbolEmojis).toEqual(symbolEmojis);
    }
  });
});
