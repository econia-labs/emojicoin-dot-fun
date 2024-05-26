// cspell:word abcdeg

import { normalizeHex } from "../../src";

describe("hex utility functions", () => {
  it("should normalize hex inputs", () => {
    const givenAndExpected = [
      ["0x123456", "0x123456"],
      ["0x12345678", "0x12345678"],
      ["123456", "0x123456"],
      ["0x00", "0x00"],
      ["0xFF", "0xff"],
      ["0xabCDeF", "0xabcdef"],
      ["0x0abCDeF0", "0x0abcdef0"],
      ["0x", "0x"],
      ["", "0x"],
      [new Uint8Array(), "0x"],
      [new Uint8Array([]), "0x"],
      [new Uint8Array([0x12, 0x34, 0x56]), "0x123456"],
      [new Uint8Array([0x12, 0x34, 0x56, 0x78]), "0x12345678"],
      [new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90]), "0x1234567890"],
      [new Uint8Array([0xff, 0xff, 0xff, 0xff]), "0xffffffff"],
    ];

    givenAndExpected.forEach(([given, expected]) => {
      expect(normalizeHex(given)).toEqual(expected);
    });

    const valuesThatWillThrow = [
      "0x1234567890abcdeg",
      "0x1234567890abcdeg",
      "z",
      "255",
      "0x12345",
      "0x1234567",
      "0x123456789",
      "0x1234567890a",
      "0x1234567890abc",
      "0x1234567890abcde",
    ];

    valuesThatWillThrow.forEach((value) => {
      expect(() => normalizeHex(value)).toThrow();
    });
  });
});
