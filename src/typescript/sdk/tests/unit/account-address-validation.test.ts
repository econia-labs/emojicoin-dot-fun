import { AccountAddress } from "@aptos-labs/ts-sdk";
import { AccountAddressSchema } from "../../src/utils/validation/account-address";

describe("AccountAddressSchema", () => {
  it("should parse valid special addresses in short form", () => {
    const special1 = AccountAddressSchema.parse("0x1");
    expect(special1).toBeInstanceOf(AccountAddress);
    expect(special1.toString()).toBe("0x1");

    const specialF = AccountAddressSchema.parse("0xf");
    expect(specialF).toBeInstanceOf(AccountAddress);
    expect(specialF.toString()).toBe("0xf");
  });

  it("should parse valid long form addresses", () => {
    const longHex = "0x" + "a".repeat(64);
    const addr = AccountAddressSchema.parse(longHex);
    expect(addr).toBeInstanceOf(AccountAddress);
    // toString returns LONG form for non-special addresses
    expect(addr.toString()).toBe(longHex);
    expect(addr.toStringLong()).toBe(longHex);
  });

  it("should reject invalid address formats", () => {
    const invalidInputs = [
      "1x0", // missing proper prefix
      "0x", // too short
      "0x" + "a".repeat(65), // too long
      "0xg123", // invalid hex char
      "", // empty string
      "1234", // no prefix
      undefined, // undefined
      null,
    ];

    invalidInputs.forEach((input) => {
      expect(() => AccountAddressSchema.parse(input)).toThrow();
    });
  });

  it("should not throw for undefined when the schema is optional", () => {
    expect(AccountAddressSchema.optional().parse(undefined)).toBeUndefined();
  });

  it("safeParse should return an error with our custom message", () => {
    const result = AccountAddressSchema.safeParse("not-an-address");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid account address format");
    }
  });

  it("transforms to AccountAddress instance preserving equality", () => {
    const input = "0x" + "1".repeat(64);
    const parsed = AccountAddressSchema.parse(input);
    // Creating a second instance the same way
    const second = AccountAddress.from(input);
    expect(parsed.equals(second)).toBe(true);
  });
});
