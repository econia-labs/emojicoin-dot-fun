import {
  AccountAddress,
  Bool,
  type EntryFunctionArgumentTypes,
  MoveOption,
  MoveString,
  MoveVector,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
} from "@aptos-labs/ts-sdk";
import { serializeEntryArgsToJsonArray, toAccountAddress, type AnyPrimitive } from "../../src";

const MAX_U8 = 2 ** 8 - 1;
const MAX_U16 = 2 ** 16 - 1;
const MAX_U32 = 2 ** 32 - 1;
const MAX_U64 = 2n ** 64n - 1n;
const MAX_U128 = 2n ** 128n - 1n;
const MAX_U256 = 2n ** 256n - 1n;

// Ensure that stringify-ing and then parsing with default JSON functions results in the same
// exact value input to the first stringify.
const expectIdempotency = (v: AnyPrimitive[]) => expect(JSON.parse(JSON.stringify(v))).toEqual(v);

describe("ensures all BCS-serializable values can be serialized to JSON-serializable values", () => {
  const bcsArgs = {
    bool_a: new Bool(true),
    bool_b: new Bool(false),
    u8_a: new U8(0),
    u8_b: new U8(MAX_U8),
    u16_a: new U16(0),
    u16_b: new U16(MAX_U16),
    u32_a: new U32(0),
    u32_b: new U32(MAX_U32),
    u64_a: new U64(0),
    u64_b: new U64(MAX_U64),
    u128_a: new U128(0),
    u128_b: new U128(MAX_U128),
    u256_a: new U256(0),
    u256_b: new U256(MAX_U256),
    string_a: new MoveString("string_a"),
    string_b: new MoveString("string_b"),
    address_a: AccountAddress.from("0x0123456789abcdef"),
    address_b: AccountAddress.from("0xfedcba9876543210"),
  };

  const bcsArrayArgs = {
    bool: MoveVector.Bool([true, false, false, true, true, true, false, true]),
    u8: MoveVector.U8([0, 1, 2, 3, MAX_U8 - 3, MAX_U8 - 2, MAX_U8 - 1, MAX_U8]),
    u16: MoveVector.U16([0, 1, 2, 3, MAX_U16 - 3, MAX_U16 - 2, MAX_U16 - 1, MAX_U16]),
    u32: MoveVector.U32([0, 1, 2, 3, MAX_U32 - 3, MAX_U32 - 2, MAX_U32 - 1, MAX_U32]),
    u64: MoveVector.U64([0n, 1n, 2n, 3n, MAX_U64 - 3n, MAX_U64 - 2n, MAX_U64 - 1n, MAX_U64]),
    u128: MoveVector.U128([0n, 1n, 2n, 3n, MAX_U128 - 3n, MAX_U128 - 2n, MAX_U128 - 1n, MAX_U128]),
    u256: MoveVector.U256([0n, 1n, 2n, 3n, MAX_U256 - 3n, MAX_U256 - 2n, MAX_U256 - 1n, MAX_U256]),
    string: MoveVector.MoveString([
      "big",
      "bad",
      "gibberish",
      "coming",
      "along",
      "here",
      "!MA31q2",
      "129837129",
    ]),
    address: new MoveVector<AccountAddress>(
      ["0x0", "0x1", "0x2", "0x3", "0xcf", "0xdf", "0xef", "0xff"].map(toAccountAddress)
    ),
  };

  it("serializes each non-option BCS-serializable type correctly", () => {
    const serialized = serializeEntryArgsToJsonArray(bcsArgs);
    const expectedJSON = [
      true,
      false,
      0,
      MAX_U8,
      0,
      MAX_U16,
      0,
      MAX_U32,
      "0",
      MAX_U64.toString(),
      "0",
      MAX_U128.toString(),
      "0",
      MAX_U256.toString(),
      "string_a",
      "string_b",
      "0x0000000000000000000000000000000000000000000000000123456789abcdef",
      "0x000000000000000000000000000000000000000000000000fedcba9876543210",
    ];
    expect(serialized).toEqual(expectedJSON);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expectIdempotency(serialized);
  });

  it("serializes option types correctly", () => {
    const optionArgs = (() => {
      const res: { [key: string]: EntryFunctionArgumentTypes } = {};
      Object.entries(bcsArgs).forEach(([k, v]) => {
        res[`option_${k}`] = new MoveOption<EntryFunctionArgumentTypes>(v);
      });
      res["option_null"] = new MoveOption<EntryFunctionArgumentTypes>(null);
      res["option_undefined"] = new MoveOption<EntryFunctionArgumentTypes>(undefined);
      return res;
    })();

    const serialized = serializeEntryArgsToJsonArray(optionArgs);
    const expectedJSON = [
      [true],
      [false],
      [0],
      [MAX_U8],
      [0],
      [MAX_U16],
      [0],
      [MAX_U32],
      ["0"],
      [MAX_U64.toString()],
      ["0"],
      [MAX_U128.toString()],
      ["0"],
      [MAX_U256.toString()],
      ["string_a"],
      ["string_b"],
      ["0x0000000000000000000000000000000000000000000000000123456789abcdef"],
      ["0x000000000000000000000000000000000000000000000000fedcba9876543210"],
      [],
      [],
    ];
    expect(serialized).toEqual(expectedJSON);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expectIdempotency(serialized);
  });

  it("serializes non-option BCS-serializable vector types correctly", () => {
    const serialized = serializeEntryArgsToJsonArray(bcsArrayArgs);
    const expectedJSON = [
      [true, false, false, true, true, true, false, true],
      [0, 1, 2, 3, MAX_U8 - 3, MAX_U8 - 2, MAX_U8 - 1, MAX_U8],
      [0, 1, 2, 3, MAX_U16 - 3, MAX_U16 - 2, MAX_U16 - 1, MAX_U16],
      [0, 1, 2, 3, MAX_U32 - 3, MAX_U32 - 2, MAX_U32 - 1, MAX_U32],
      [0n, 1n, 2n, 3n, MAX_U64 - 3n, MAX_U64 - 2n, MAX_U64 - 1n, MAX_U64].map(String),
      [0n, 1n, 2n, 3n, MAX_U128 - 3n, MAX_U128 - 2n, MAX_U128 - 1n, MAX_U128].map(String),
      [0n, 1n, 2n, 3n, MAX_U256 - 3n, MAX_U256 - 2n, MAX_U256 - 1n, MAX_U256].map(String),
      ["big", "bad", "gibberish", "coming", "along", "here", "!MA31q2", "129837129"],
      ["0x0", "0x1", "0x2", "0x3", "0xcf", "0xdf", "0xef", "0xff"]
        .map(toAccountAddress)
        .map((v) => v.toString()),
    ];
    expect(serialized).toEqual(expectedJSON);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expectIdempotency(serialized);
  });

  it("serializes deeply nested vectors correctly", () => {
    const moveValues = {
      val1: new MoveVector<MoveVector<U8>>([
        MoveVector.U8([1, 2]),
        MoveVector.U8([2, 1]),
        MoveVector.U8([3, 1]),
      ]),
      val2: new MoveVector<MoveVector<U8>>([
        MoveVector.U8([1, 2, 3]),
        MoveVector.U8([3, 2, 1]),
        MoveVector.U8([4, 5, 6]),
        MoveVector.U8([6, 5, 4]),
      ]),
      val3: new MoveVector<MoveVector<U32>>([[], [], [], [], [1, 2, 3]].map(MoveVector.U32)),
      val4: new MoveVector<MoveVector<MoveVector<U128>>>([
        new MoveVector<MoveVector<U128>>([[1], [2, 3], [4, 5, 6]].map(MoveVector.U128)),
        new MoveVector<MoveVector<U128>>([[5, 6, 7, 8], [9]].map(MoveVector.U128)),
      ]),
    };
    const expectedJSON = [
      [
        [1, 2],
        [2, 1],
        [3, 1],
      ],
      [
        [1, 2, 3],
        [3, 2, 1],
        [4, 5, 6],
        [6, 5, 4],
      ],
      [[], [], [], [], [1, 2, 3]],
      [
        [[1], [2, 3], [4, 5, 6]].map((v) => v.map(String)),
        [[5, 6, 7, 8], [9]].map((v) => v.map(String)),
      ],
    ];
    const serialized = serializeEntryArgsToJsonArray(moveValues);
    expect(serialized).toEqual(expectedJSON);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expectIdempotency(serialized);
  });
});
