import { encodeToHexString } from "../../src";
import { SymbolEmojisSchema } from "../../src/utils/validation/symbol-emoji";

describe("SymbolEmojisSchema", () => {
  const singleEmoji = encodeToHexString("🚀");
  const multipleEmojis = encodeToHexString("🚀🌟");
  const tooManyEmojis = encodeToHexString("🚀🌟🌟");
  const nonSymbolEmoji = encodeToHexString("🏳️‍⚧️");

  describe("validation", () => {
    it("should pass for valid emoji strings", () => {
      expect(() => SymbolEmojisSchema.parse(singleEmoji)).not.toThrow();
      expect(() => SymbolEmojisSchema.parse(multipleEmojis)).not.toThrow();
    });

    it("should fail for strings longer than MAX_SYMBOL_LENGTH (10 bytes)", () => {
      expect(() => SymbolEmojisSchema.parse(tooManyEmojis)).toThrow();
    });

    it("should return empty array for empty string", () => {
      const result = SymbolEmojisSchema.parse("");
      expect(result).toEqual([]);
    });

    it("should fail for non-emoji strings", () => {
      expect(() => SymbolEmojisSchema.parse("abc")).toThrow();
      expect(() => SymbolEmojisSchema.parse("123")).toThrow();
      expect(() => SymbolEmojisSchema.parse("!@#")).toThrow();
    });

    it("should fail for mixed emoji and non-emoji strings", () => {
      expect(() => SymbolEmojisSchema.parse(singleEmoji + "abc")).toThrow();
      expect(() => SymbolEmojisSchema.parse("123" + multipleEmojis)).toThrow();
    });

    describe("Non symbol emojis", () => {
      it("should fail for non-symbol emojis", () => {
        expect(() => SymbolEmojisSchema.parse(nonSymbolEmoji)).toThrow();
      });

      it("should fail for mix of valid and invalid symbol emoji", () => {
        expect(() => SymbolEmojisSchema.parse(nonSymbolEmoji + singleEmoji)).toThrow();
      });
    });

    describe("transformation", () => {
      it("should transform single emoji to array", () => {
        const result = SymbolEmojisSchema.parse(singleEmoji);
        expect(result).toEqual(["🚀"]);
      });

      it("should transform multiple emojis to array", () => {
        const result = SymbolEmojisSchema.parse(multipleEmojis);
        expect(result).toEqual(["🚀", "🌟"]);
      });
    });
  });
});
