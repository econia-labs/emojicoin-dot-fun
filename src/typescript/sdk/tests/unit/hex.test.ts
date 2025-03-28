// cspell:word abcdeg

import type { TypeTagStruct } from "@aptos-labs/ts-sdk";
import { AccountAddress } from "@aptos-labs/ts-sdk";

import type { StructTagString } from "../../src";
import {
  APTOS_COIN_TYPE_STRING,
  chunk,
  deserializeToHexString,
  generateRandomSymbol,
  getMarketAddress,
  normalizeHex,
  padAddressInput,
  removeLeadingZeros,
  removeLeadingZerosFromStructString,
  standardizeAddress,
  toAccountAddress,
  toAccountAddressString,
  toEmojicoinTypes,
  zip,
} from "../../src";

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

  it("should remove leading zeros from hex string inputs", () => {
    const givenAndExpected = [
      ["0x0", "0x0"],
      ["0x1", "0x1"],
      ["0x2", "0x2"],
      ["0x9", "0x9"],
      ["0xff", "0xff"],
      ["0x16", "0x16"],
      ["0x0b", "0xb"],
      ["0x0123", "0x123"],
    ];
    givenAndExpected.forEach(([given, expected]) => {
      expect(removeLeadingZeros(given)).toEqual(expected);
    });
  });
  it("should remove leading zeros from hex string inputs without a leading `0x`", () => {
    const givenAndExpected = [
      ["0", "0x0"],
      ["1", "0x1"],
      ["2", "0x2"],
      ["9", "0x9"],
      ["ff", "0xff"],
      ["16", "0x16"],
      ["0b", "0xb"],
      ["0123", "0x123"],
      ["0000000000000000000000000000000000000000000000000000000000000001", "0x1"],
      [
        "225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
        "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
      ],
      [
        "0225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
        "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
      ],
    ];
    givenAndExpected.forEach(([given, expected]) => {
      expect(removeLeadingZeros(given)).toEqual(expected);
    });
  });

  it("should pad addresses properly", () => {
    const tsSDKAndOurs = [
      // No leading 0x in ours.
      [AccountAddress.from("ff".padStart(64, "0")), "ff", padAddressInput("ff")],
      [AccountAddress.from("16".padStart(64, "0")), "16", padAddressInput("16")],
      [AccountAddress.from("0b".padStart(64, "0")), "b", padAddressInput("b")],
      [AccountAddress.from("0123".padStart(64, "0")), "123", padAddressInput("123")],
      // With leading 0x in ours.
      [AccountAddress.from("ff".padStart(64, "0")), "0xff", padAddressInput("0xff")],
      [AccountAddress.from("16".padStart(64, "0")), "0x16", padAddressInput("0x16")],
      [AccountAddress.from("0b".padStart(64, "0")), "0xb", padAddressInput("0xb")],
      [AccountAddress.from("0123".padStart(64, "0")), "0x123", padAddressInput("0x123")],
      // Pad SDK input with leading 0x. No leading 0x in ours.
      [AccountAddress.from(`0x${"ff".padStart(64, "0")}`), "ff", padAddressInput("ff")],
      [AccountAddress.from(`0x${"16".padStart(64, "0")}`), "16", padAddressInput("16")],
      [AccountAddress.from(`0x${"0b".padStart(64, "0")}`), "b", padAddressInput("b")],
      [AccountAddress.from(`0x${"0123".padStart(64, "0")}`), "123", padAddressInput("123")],
      // Pad SDK input with leading 0x. With leading 0x in ours.
      [AccountAddress.from(`0x${"ff".padStart(64, "0")}`), "0xff", padAddressInput("0xff")],
      [AccountAddress.from(`0x${"16".padStart(64, "0")}`), "0x16", padAddressInput("0x16")],
      [AccountAddress.from(`0x${"0b".padStart(64, "0")}`), "0xb", padAddressInput("0xb")],
      [AccountAddress.from(`0x${"0123".padStart(64, "0")}`), "0x123", padAddressInput("0x123")],
    ];
    tsSDKAndOurs.forEach(([addressFromSDK, ours, justPadded]) => {
      const fromSDK = addressFromSDK.toString();
      expect(fromSDK).toEqual(toAccountAddressString(ours));
      expect(fromSDK).toEqual(toAccountAddressString(justPadded));
      expect(fromSDK).toEqual(toAccountAddress(ours).toString());
      expect(fromSDK).toEqual(toAccountAddress(justPadded).toString());
      expect(fromSDK).toEqual(standardizeAddress(ours));
      expect(fromSDK).toEqual(standardizeAddress(justPadded));
    });
  });

  it("should remove leading zeroes from AccountAddresses", () => {
    const givenAndExpected = [
      [AccountAddress.from("0x0"), "0x0"],
      [AccountAddress.from("0x1"), "0x1"],
      [AccountAddress.from("0x2"), "0x2"],
      [AccountAddress.from("0x9"), "0x9"],
      [AccountAddress.from("ff".padStart(64, "0")), "0xff"],
      [AccountAddress.from("16".padStart(64, "0")), "0x16"],
      [AccountAddress.from("0b".padStart(64, "0")), "0xb"],
      [AccountAddress.from("0123".padStart(64, "0")), "0x123"],
      [
        AccountAddress.from("0000000000000000000000000000000000000000000000000000000000000001"),
        "0x1",
      ],
      [
        AccountAddress.from("225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0"),
        "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
      ],
      [
        AccountAddress.from("0225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0"),
        "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0",
      ],
    ];
    givenAndExpected.forEach(([given, expected]) => {
      expect(removeLeadingZeros(given)).toEqual(expected);
    });
  });

  it("should remove leading zeroes from a coin type tag", () => {
    const assetType1: StructTagString =
      "0x0225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0::coin_factory::Emojicoin";
    const assetType2: StructTagString =
      "0x0225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0::module::Struct";
    const assetType3: StructTagString = "0x000001::module::Struct";
    const assetType4: StructTagString = "0x001::aptos_coin::AptosCoin";
    expect(removeLeadingZerosFromStructString(assetType1)).toEqual(
      "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0::coin_factory::Emojicoin"
    );
    expect(removeLeadingZerosFromStructString(assetType2)).toEqual(
      "0x225708cc6557dcea948575ad85e8849322f7c13ad176f80c51514f36a34a9a0::module::Struct"
    );
    expect(removeLeadingZerosFromStructString(assetType3)).toEqual("0x1::module::Struct");
    expect(removeLeadingZerosFromStructString(assetType4)).toEqual(APTOS_COIN_TYPE_STRING);
  });

  it("should remove leading zeroes from an emojicoin type tag with leading zeros", () => {
    // Since the factory address can change, just find an address with leading zeros randomly.
    // There's a 1/16 chance it will start with a leading zero.
    let base: TypeTagStruct;
    let lp: TypeTagStruct;
    do {
      const { emojis } = generateRandomSymbol();
      const marketAddress = getMarketAddress(emojis.map((v) => v.emoji));
      const { emojicoin, emojicoinLP } = toEmojicoinTypes(marketAddress);
      if (
        emojicoin.toString().startsWith("0x0") &&
        emojicoin.isStruct() &&
        emojicoinLP.isStruct()
      ) {
        base = emojicoin;
        lp = emojicoinLP;
        break;
      }
    } while (true);

    const baseTypeString = base.toString();
    const baseNoLeadingZeros = removeLeadingZerosFromStructString(baseTypeString);
    const lpTypeString = lp.toString();
    const lpNoLeadingZeros = removeLeadingZerosFromStructString(lpTypeString);

    expect(baseTypeString.startsWith("0x0")).toBe(true);
    expect(baseNoLeadingZeros.startsWith("0x0")).toBe(false);
    expect(baseTypeString.endsWith("::coin_factory::Emojicoin")).toBe(true);
    expect(baseNoLeadingZeros.endsWith("::coin_factory::Emojicoin")).toBe(true);

    expect(lpTypeString.startsWith("0x0")).toBe(true);
    expect(lpNoLeadingZeros.startsWith("0x0")).toBe(false);
    expect(lpTypeString.endsWith("::coin_factory::EmojicoinLP")).toBe(true);
    expect(lpNoLeadingZeros.endsWith("::coin_factory::EmojicoinLP")).toBe(true);
  }, 2000);

  const hexInputs = ["0011223344", "4433221100", "0123456789", "0f", "f0", "00", "ff", ""];
  const hexOutputs = hexInputs.map((v) => `0x${v}`);
  it("deserializes symbol hex bytes from the broker properly, with number[] and Uint8Array", () => {
    const hexInputsAsNumbers = hexInputs.map((v) =>
      chunk(Array.from(v), 2)
        .map((pair) => pair.join(""))
        .map((hexValue) => parseInt(hexValue, 16))
    );
    zip(hexInputsAsNumbers, hexOutputs).forEach(([input, output]) => {
      expect(deserializeToHexString(input)).toEqual(output);
      const asBytes = new Uint8Array(input);
      expect(deserializeToHexString(asBytes)).toEqual(output);
    });
  });

  it("deserializes symbol hex bytes from a postgres JSON response properly, with & w/o leading 0x", () => {
    const postgresHexInputs = hexInputs.map((v) => `\\x${v}` as const);
    zip(postgresHexInputs, hexOutputs).forEach(([input, output]) => {
      expect(deserializeToHexString(input)).toEqual(output);
    });
  });

  it("deserializes symbol bytes from a 0x${string} hex string properly, with & w/o leading 0x", () => {
    const withPrefixes = hexInputs.map((v) => `0x${v}` as const);
    zip(withPrefixes, hexOutputs).forEach(([input, output]) => {
      expect(deserializeToHexString(input)).toEqual(output);
    });
  });
});
