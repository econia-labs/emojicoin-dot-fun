import { SYMBOL_DATA } from "../../src";
import { getEmojisInString, isValidSymbol, symbolToEmojis } from "../../src/emoji_data/utils";
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
    expect(emojiData).toHaveLength(7);
    const names = new Set(Object.keys(SymbolEmojiData));
    emojiData.forEach((emoji) => {
      expect(names.has(emoji.name)).toBe(true);
    });
  });
});
