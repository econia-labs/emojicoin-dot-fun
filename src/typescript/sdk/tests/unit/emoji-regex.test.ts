import { CHAT_EMOJI_DATA, type ChatEmoji, SYMBOL_EMOJI_DATA, type SymbolEmoji } from "../../src";
import { encodeEmojis, getEmojisInString, symbolToEmojis } from "../../src/emoji_data/utils";
import { SYMBOL_EMOJIS } from "../../src/emoji_data/symbol-emojis";
import { toChatMessageEntryFunctionArgs } from "../../src/emoji_data/chat-message";
import { isValidMarketSymbol } from "../utils/market-symbol";

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
    const symbols = new Set(Object.keys(SYMBOL_EMOJIS));
    const names = new Set(Object.values(SYMBOL_EMOJIS));
    const emojis = new Array<SymbolEmoji>("🎅", "🎅🏽", "🎅🏼", "🎅🏿", "🌎", "🇧🇷", "⭐").map((v) =>
      SYMBOL_EMOJI_DATA.byEmojiStrict(v)
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
    const symbols = new Set(Object.keys(SYMBOL_EMOJIS));
    const names = new Set(Object.values(SYMBOL_EMOJIS));
    emojiData.emojis.forEach((emoji) => {
      expect(symbols.has(emoji.emoji)).toBe(true);
      expect(names.has(emoji.name)).toBe(true);
    });
  });

  it("encodes emojis", () => {
    const symbolsForward = [
      SYMBOL_EMOJI_DATA.byStrictName("ATM sign"),
      SYMBOL_EMOJI_DATA.byStrictName("Aquarius"),
      SYMBOL_EMOJI_DATA.byStrictName("yin yang"),
      SYMBOL_EMOJI_DATA.byStrictName("Cancer"),
      SYMBOL_EMOJI_DATA.byStrictName("world map"),
      SYMBOL_EMOJI_DATA.byStrictName("yellow heart"),
      SYMBOL_EMOJI_DATA.byStrictName("black cat"),
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

  it("constructs the chat message entry function args with the helper function correctly", () => {
    // Symbol emojis.
    const a: SymbolEmoji[] = ["⛄", "🎽", "🏃🏻"];
    // Chat emojis.
    const b: ChatEmoji[] = ["👩🏻‍🦼‍➡️", "👩🏾‍🎤", "🏊‍♀️", "🚴‍♂️"];
    // symbols 012, chats 0123.
    const indices = [a[0], a[1], a[2], b[0], b[1], b[2], b[3]];
    // symbols 012, chats 0123, chats 3210, symbols 210.
    const fullIndices = [...indices, ...indices.toReversed()];
    const message = fullIndices.join("");
    const args = toChatMessageEntryFunctionArgs(message);
    expect(args.emojiBytes).toEqual([
      SYMBOL_EMOJI_DATA.byEmojiStrict(a[0]).bytes,
      SYMBOL_EMOJI_DATA.byEmojiStrict(a[1]).bytes,
      SYMBOL_EMOJI_DATA.byEmojiStrict(a[2]).bytes,
      CHAT_EMOJI_DATA.byEmojiStrict(b[0]).bytes,
      CHAT_EMOJI_DATA.byEmojiStrict(b[1]).bytes,
      CHAT_EMOJI_DATA.byEmojiStrict(b[2]).bytes,
      CHAT_EMOJI_DATA.byEmojiStrict(b[3]).bytes,
    ]);
    expect(Array.from(args.emojiIndicesSequence)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 1, 0,
    ]);
  });
});
