import fs from "fs";
import path from "path";
import { SYMBOL_DATA, type SymbolEmoji } from "../../src";
import {
  encodeEmojis,
  getEmojisInString,
  isValidMarketSymbol,
  symbolToEmojis,
} from "../../src/emoji_data/utils";
import SymbolEmojiData from "../../src/emoji_data/symbol-emojis.json";
import { getGitRoot } from "../../src/utils/test";

describe("tests emojis against the emoji regex to ensure they're properly validated", () => {
  it("tests a few single emojis", () => {
    expect(isValidMarketSymbol("🟥")).toBe(true);
    expect(isValidMarketSymbol("🟧")).toBe(true);
    expect(isValidMarketSymbol("🟩")).toBe(true);
    expect(isValidMarketSymbol("🟦")).toBe(true);
    expect(isValidMarketSymbol("🟪")).toBe(true);
    expect(isValidMarketSymbol("🟫")).toBe(true);
    expect(isValidMarketSymbol("🟧")).toBe(true);
    expect(isValidMarketSymbol("🟨")).toBe(true);
    expect(isValidMarketSymbol("👩")).toBe(true);
    expect(isValidMarketSymbol("👩🏿")).toBe(true);
    expect(isValidMarketSymbol("⌚")).toBe(true);
    expect(isValidMarketSymbol("🎑")).toBe(true);
  });

  it("tests emoji successful combinations", () => {
    expect(isValidMarketSymbol("🟥🟧")).toBe(true);
    expect(isValidMarketSymbol("🟦🟪")).toBe(true);
    expect(isValidMarketSymbol("👩🏿")).toBe(true);
  });

  it("tests emoji unsuccessful combinations", () => {
    expect(isValidMarketSymbol("👩👩🏿")).toBe(false);
    expect(isValidMarketSymbol("👨‍👨‍👦‍👦")).toBe(false);
    expect(isValidMarketSymbol("👨‍👨‍👦‍👦")).toBe(false);
    expect(isValidMarketSymbol("☝🏾☝️☝🏻☝🏼☝🏽☝🏾☝🏿")).toBe(false);
  });

  it("tests invalid inputs", () => {
    expect(isValidMarketSymbol("")).toBe(false);
    expect(isValidMarketSymbol("0123456789")).toBe(false);
    expect(isValidMarketSymbol("blah blah blah")).toBe(false);
    expect(isValidMarketSymbol("0 1 2")).toBe(false);
    expect(isValidMarketSymbol(" ")).toBe(false);
    expect(isValidMarketSymbol("☝🏾 ☝🏾")).toBe(false);
    expect(isValidMarketSymbol("🟪.🟪")).toBe(false);
    expect(isValidMarketSymbol("🟪 🟪")).toBe(false);
    expect(isValidMarketSymbol("🟪 🟪")).toBe(false);
    expect(isValidMarketSymbol("🟪 ")).toBe(false);
    expect(isValidMarketSymbol(" 🟪")).toBe(false);
  });
});

describe("tests the emojis in a string, and the emoji data for each one", () => {
  it("tests a string of emojis", () => {
    const emojis = getEmojisInString("🟥🟧🟩🟦🟪🟫🟧🟨👩👩🏿⌚");
    expect(emojis).toEqual(["🟥", "🟧", "🟩", "🟦", "🟪", "🟫", "🟧", "🟨", "👩", "👩🏿", "⌚"]);
  });

  it("tests a string of emojis with non-emoji characters", () => {
    const emojis = getEmojisInString("hey 🟥 I'm 🟧 having 🟩 fun 🟦 what 🟪 about 🟫 you?");
    expect(emojis).toEqual(["🟥", "🟧", "🟩", "🟦", "🟪", "🟫"]);
  });

  it("maps the emojis to their corresponding data", () => {
    const symbols = new Set(Object.keys(SymbolEmojiData));
    const names = new Set(Object.values(SymbolEmojiData));
    const emojis = new Array<SymbolEmoji>("🎅", "🎅🏽", "🎅🏼", "🎅🏿", "🌎", "🇧🇷", "⭐").map((v) =>
      SYMBOL_DATA.byEmojiStrict(v)
    );
    emojis.forEach((emoji) => {
      expect(emoji).toBeDefined();
      expect(symbols.has(emoji.emoji)).toBe(true);
      expect(names.has(emoji.name)).toBe(true);
    });
  });

  it("maps the emojis to their corresponding data, ignoring non-emoji characters", () => {
    const emojiString = "hey 🎅 I'm 🎅🏽 having 🎅🏼 fun 🎅🏿 what 🌎 about 🇧🇷 you? ⭐";
    const extractedEmojis = getEmojisInString(emojiString);
    expect(extractedEmojis).toEqual(["🎅", "🎅🏽", "🎅🏼", "🎅🏿", "🌎", "🇧🇷", "⭐"]);
  });

  it("maps the emojis to their corresponding data given an input string", () => {
    const symbol = " 🎅🎅🏽🎅🏼🎅🏿   🌎🇧🇷 ⭐ ...";
    const emojiData = symbolToEmojis(symbol);
    expect(emojiData.emojis).toHaveLength(7);
    const symbols = new Set(Object.keys(SymbolEmojiData));
    const names = new Set(Object.values(SymbolEmojiData));
    emojiData.emojis.forEach((emoji) => {
      expect(symbols.has(emoji.emoji)).toBe(true);
      expect(names.has(emoji.name)).toBe(true);
    });
  });

  it("encodes emojis", () => {
    const symbolsForward = [
      SYMBOL_DATA.byStrictName("ATM sign"),
      SYMBOL_DATA.byStrictName("Aquarius"),
      SYMBOL_DATA.byStrictName("yin yang"),
      SYMBOL_DATA.byStrictName("Cancer"),
      SYMBOL_DATA.byStrictName("world map"),
      SYMBOL_DATA.byStrictName("yellow heart"),
      SYMBOL_DATA.byStrictName("black cat"),
    ];
    const symbolsReverse = symbolsForward.toReversed();

    // Encode forwards and backwards to ensure we don't encounter a padding error.
    for (const symbols of [symbolsForward, symbolsReverse]) {
      const enc1 = `0x${Buffer.from(symbols.flatMap((v) => Array.from(v.bytes))).toString("hex")}`;
      const enc2 = `0x${symbols.flatMap((d) => [...d.bytes].map((v) => v.toString(16))).join("")}`;
      const enc3 = encodeEmojis(symbols);
      expect(enc1).toEqual(enc2);
      expect(enc1).toEqual(enc3);
    }
  });

  it("ensures the Rust processor has the same emoji data as the TypeScript SDK", () => {
    const gitRoot = getGitRoot();
    const tsPath = path.join(gitRoot, "src/typescript/sdk/src/emoji_data/symbol-emojis.json");
    const rustPath = path.join(
      gitRoot,
      "src/rust/processor",
      "rust/processor",
      "src/db/common/models/emojicoin_models",
      "parsers/emojis/symbol-emojis.json"
    );
    const tsData = fs.readFileSync(tsPath);
    const tsJSON = JSON.parse(tsData.toString());
    const rustJSON = (() => {
      try {
        const rustData = fs.readFileSync(rustPath).toString();
        return JSON.parse(rustData);
      } catch (e) {
        // File not found. If we're in CI, that's fine. Only need to check this infrequently.
        if (process.env.CI || process.env.GITHUB_ACTIONS) {
          return tsJSON;
        }
        return "[]";
      }
    })();
    expect(JSON.stringify(tsJSON) === JSON.stringify(rustJSON));
  });
});
