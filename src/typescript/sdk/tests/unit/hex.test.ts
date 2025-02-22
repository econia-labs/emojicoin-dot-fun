// cspell:word abcdeg

import { AccountAddress, type TypeTagStruct } from "@aptos-labs/ts-sdk";
import {
  removeLeadingZerosFromStructString,
  normalizeHex,
  removeLeadingZeros,
  type StructTagString,
  APTOS_COIN_TYPE_TAG,
  generateRandomSymbol,
  toCoinTypes,
  getMarketAddress,
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

  it("should remove leading zeroes from AccountAddresses", () => {
    const givenAndExpected = [
      [AccountAddress.from("0x0"), "0x0"],
      [AccountAddress.from("0x1"), "0x1"],
      [AccountAddress.from("0x2"), "0x2"],
      [AccountAddress.from("0x9"), "0x9"],
      [AccountAddress.from("0xff"), "0xff"],
      [AccountAddress.from("0x16"), "0x16"],
      [AccountAddress.from("0x0b"), "0xb"],
      [AccountAddress.from("0x0123"), "0x123"],
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
    expect(removeLeadingZerosFromStructString(assetType4)).toEqual(APTOS_COIN_TYPE_TAG.toString());
  });

  it("should remove leading zeroes from an emojicoin type tag with leading zeros", () => {
    // Since the factory address can change, just find an address with leading zeros randomly.
    // There's a 1/16 chance it will start with a leading zero.
    let base: TypeTagStruct;
    let lp: TypeTagStruct;
    do {
      const { emojis } = generateRandomSymbol();
      const marketAddress = getMarketAddress(emojis.map((v) => v.emoji));
      const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
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
});
