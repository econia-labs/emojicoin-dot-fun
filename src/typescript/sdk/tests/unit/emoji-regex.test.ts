import { SYMBOL_DATA } from "../../src";
import {
  encodeEmojis,
  encodeSymbols,
  getEmojisInString,
  isValidSymbol,
  symbolToEmojis,
} from "../../src/emoji_data/utils";
import SymbolEmojiData from "../../src/emoji_data/symbol-emojis.json";

describe("tests emojis against the emoji regex to ensure they're properly validated", () => {
  it("tests a few single emojis", () => {
    expect(isValidSymbol("🟥")).toBe(true);
    expect(isValidSymbol("🟧")).toBe(true);
    expect(isValidSymbol("🟩")).toBe(true);
    expect(isValidSymbol("🟦")).toBe(true);
    expect(isValidSymbol("🟪")).toBe(true);
    expect(isValidSymbol("🟫")).toBe(true);
    expect(isValidSymbol("🟧")).toBe(true);
    expect(isValidSymbol("🟨")).toBe(true);
    expect(isValidSymbol("👩")).toBe(true);
    expect(isValidSymbol("👩🏿")).toBe(true);
    expect(isValidSymbol("⌚")).toBe(true);
    expect(isValidSymbol("🎑")).toBe(true);
  });

  it("tests emoji successful combinations", () => {
    expect(isValidSymbol("🟥🟧")).toBe(true);
    expect(isValidSymbol("🟦🟪")).toBe(true);
    expect(isValidSymbol("👩🏿")).toBe(true);
  });

  it("tests emoji unsuccessful combinations", () => {
    expect(isValidSymbol("👩👩🏿")).toBe(false);
    expect(isValidSymbol("👨‍👨‍👦‍👦")).toBe(false);
    expect(isValidSymbol("👨‍👨‍👦‍👦")).toBe(false);
    expect(isValidSymbol("☝🏾☝️☝🏻☝🏼☝🏽☝🏾☝🏿")).toBe(false);
  });

  it("tests invalid inputs", () => {
    expect(isValidSymbol("")).toBe(false);
    expect(isValidSymbol("0123456789")).toBe(false);
    expect(isValidSymbol("blah blah blah")).toBe(false);
    expect(isValidSymbol("0 1 2")).toBe(false);
    expect(isValidSymbol(" ")).toBe(false);
    expect(isValidSymbol("☝🏾 ☝🏾")).toBe(false);
    expect(isValidSymbol("🟪.🟪")).toBe(false);
    expect(isValidSymbol("🟪 🟪")).toBe(false);
    expect(isValidSymbol("🟪 🟪")).toBe(false);
    expect(isValidSymbol("🟪 ")).toBe(false);
    expect(isValidSymbol(" 🟪")).toBe(false);
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

  it("maps the emojis to their corresponding data correctly", () => {
    const names = new Set(Object.keys(SymbolEmojiData));
    const emojis = ["🎅", "🎅🏽", "🎅🏼", "🎅🏿", "🌎", "🇧🇷", "⭐"].map((v) => SYMBOL_DATA.byEmoji(v)!);
    emojis.forEach((emoji) => {
      expect(emoji).toBeDefined();
      expect(names.has(emoji.name)).toBe(true);
    });
  });

  it("maps the emojis to their corresponding data correctly, ignoring non-emoji characters", () => {
    const emojiString = "hey 🎅 I'm 🎅🏽 having 🎅🏼 fun 🎅🏿 what 🌎 about 🇧🇷 you? ⭐";
    const extractedEmojis = getEmojisInString(emojiString);
    expect(extractedEmojis).toEqual(["🎅", "🎅🏽", "🎅🏼", "🎅🏿", "🌎", "🇧🇷", "⭐"]);
  });

  it("maps the emojis to their corresponding data given an input string", () => {
    const symbol = " 🎅🎅🏽🎅🏼🎅🏿   🌎🇧🇷 ⭐ ...";
    const emojiData = symbolToEmojis(symbol);
    expect(emojiData.emojis).toHaveLength(7);
    const names = new Set(Object.keys(SymbolEmojiData));
    emojiData.emojis.forEach((emoji) => {
      expect(names.has(emoji.name)).toBe(true);
    });
  });

  it("encodes emojis correctly", () => {
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
      const enc4 = encodeSymbols(symbols);
      expect(enc1).toEqual(enc2);
      expect(enc1).toEqual(enc3);
      expect(enc1).toEqual(enc4);
    }
  });
});
