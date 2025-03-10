import { z } from "zod";
import { isPositiveInteger, toPositiveBigInt, toPositiveInteger } from "../../src/utils/validation";
import { createSchemaParser } from "../../src/utils/validation";
import { toBigInt } from "../../src/utils/validation/bigint";
import { toInteger } from "../../src/utils/validation/integer";

describe("basic numeric validation", () => {
  test.each(
    [0, 1, 2, 3, Number.MAX_SAFE_INTEGER].flatMap((v) => [
      Number(v),
      Number(v) * -1,
      String(v),
      `-${String(v)}`,
      BigInt(v),
      BigInt(v) * -1n,
    ])
  )("%p is an integer, maybe positive", (input) => {
    const parsed = toInteger(input)!;
    expect(parsed).not.toBe(null);
    if (parsed > 0) {
      expect(isPositiveInteger(input)).toBe(true);
      expect(toPositiveInteger(input)).toEqual(parsed);
    } else {
      expect(isPositiveInteger(input)).toBe(false);
      expect(toPositiveInteger(input)).toBe(null);
    }
  });

  test.each([1, 2, 3, 4, 5].flatMap((v) => [Number(v), String(v), BigInt(v)]))(
    "%p is a positive integer",
    (num) => {
      if (toPositiveInteger(num) !== Number(num)) {
        console.warn(num, toPositiveInteger(num), Number(num));
      }
      expect(toPositiveInteger(num)).toEqual(Number(num));
    }
  );

  test.each([0, -0, -1, -2, -3, -4, -5].flatMap((v) => [Number(v), String(v), BigInt(v)]))(
    "%p is not a positive integer",
    (num) => {
      expect(toPositiveInteger(num)).toBe(null);
    }
  );
});

test.each(
  [
    0,
    1,
    2,
    "100",
    "101",
    "458237465832657",
    "458237465832657",
    "86238628463838234847484287423843874",
    "999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999",
    0.0,
  ].flatMap((v) => [
    BigInt(v) <= Number.MAX_SAFE_INTEGER ? Number(v) : 0,
    String(v),
    `-${String(v)}`,
    BigInt(v),
    BigInt(v) * -1n,
  ])
)("%p is a bigint", (input) => {
  const result = toBigInt(input)!;
  if (result === null) {
    console.warn(input);
  }
  expect(result).not.toBe(null);
  if (typeof input === "string" && input.endsWith("n")) {
    expect(result).toEqual(BigInt(input.slice(0, -1)));
  }
  if (result <= 0n) {
    expect(toPositiveBigInt(input)).toBe(null);
  } else {
    expect(toPositiveBigInt(input)).toEqual(result);
  }
});

test.each([1.234e10, 100.5e6, Number.MAX_SAFE_INTEGER, -11.142e12])(
  "%s is a valid integer",
  (input) => {
    const result = toInteger(input)!;
    expect(result).not.toBe(null);
    expect(result / 10).toEqual(Number(input) / 10);
    expect(result - 1).toEqual(Number(input) - 1);
    expect(result - 1).toEqual(Number(input) - 1);
  }
);

test.each([1.123e100, 1.4e50, "1182361283683863837244"])("%s is an invalid integer", (input) => {
  const result = toInteger(input)!;
  expect(result).toBe(null);
});

test.each([1.234e10, 100.5e20, -123.412123675127353e30, Number.MAX_VALUE])(
  "%p is a valid bigint",
  (input) => {
    const result = toBigInt(input)!;
    expect(result).not.toBe(null);
    expect(result * 10n).toEqual(BigInt(input) * 10n);
    expect(result - 1n).toEqual(BigInt(input) - 1n);
    expect(result - 1n).toEqual(BigInt(input) - 1n);
  }
);

it("doesn't prematurely lose precision due to the parsing function", () => {
  const maxValue = Number.MAX_VALUE;
  const result = toBigInt(maxValue)!;
  expect(result).not.toBe(null);
  expect(result - 1n).toEqual(BigInt(maxValue) - 1n);

  // Note that this *does* lose precision:
  expect(toBigInt(maxValue - 1)).not.toEqual(result - 1n);
  expect(toBigInt(maxValue - 1)).not.toEqual(BigInt(maxValue) - 1n);
});

test.each([1.234e2, 1.23456e3, 1.23456789341723e5])(
  "%p is not a valid integer or bigint",
  (input) => {
    const result = toBigInt(input);
    expect(result).toBe(null);
    const result2 = toInteger(input);
    expect(result2).toBe(null);
  }
);

test.each([
  "01",
  "-01",
  "-0000000000000012",
  "-1.01",
  1.01,
  [1, 2, 3],
  [1n],
  "[1n]",
  " 1n",
  " n",
  "       n",
  " ",
  "",
  " 1",
  "01n",
  "-01n",
  "0.0",
  "-0.0",
  0.00000000000000000000000000000000000000000000000000000000000000000000000000000000001,
  "0.00000000000000000000000000000000000000000000000000000000000000000000000000000000001",
])("%p is an invalid integer input", (num) => {
  expect(toInteger(num)).toBe(null);
  expect(toBigInt(num)).toBe(null);
});

describe("bigint input validation", () => {
  it("ensures idempotency with non-base-10 inputs", () => {
    expect(toPositiveBigInt(0o001)).toBe(BigInt(0o001));
    expect(toPositiveBigInt("001")).toBe(null);
  });

  it("provides a default value for zod schemas", () => {
    expect(toPositiveBigInt("1.01")).toBe(null);
    expect(toPositiveBigInt("1.01", 1n)).toEqual(1n);
    expect(toPositiveBigInt("1.01", 1281n)).toEqual(1281n);
    expect(toPositiveInteger("-1", 10)).toEqual(10);
    expect(toPositiveInteger("1", 10)).toEqual(1);
    expect(toPositiveInteger("0", 77)).toEqual(77);
    expect(toPositiveInteger("-0", 77)).toEqual(77);
    expect(toPositiveInteger(0, 77)).toEqual(77);
    expect(toPositiveInteger(-0, 77)).toEqual(77);
    expect(toPositiveInteger(-100, 100)).toEqual(100);
  });

  it("should throw when an invalid default value is passed", () => {
    const PositiveBigInt = z.bigint().positive();
    const parser = createSchemaParser(PositiveBigInt);

    expect(() => parser(1n, -1n)).toThrow();
    expect(() => parser(0, "-12" as unknown as bigint)).toThrow();
    expect(() => parser(0, "-0" as unknown as bigint)).toThrow();
    expect(() => parser(0, "0" as unknown as bigint)).toThrow();
  });

  it("shouldn't throw when a valid default value is passed", () => {
    const customPosBigIntSchema = z.bigint().positive();
    const parser = createSchemaParser(customPosBigIntSchema);

    // This should work, because 1n is a valid default positive bigint.
    expect(() => parser("not_a_bigint", 1n)).not.toThrow();

    expect(parser("not_a_bigint", 1n)).toEqual(1n);
    expect(parser(2n)).toEqual(2n);
    expect(parser("not_a_bigint")).toBe(null);
  });

  it("uses the schema parser helper with a simple example", () => {
    const NegativeNumber = z.number().negative();
    const toNegativeNumber = createSchemaParser(NegativeNumber);
    const alwaysANumber = toNegativeNumber("not_a_number", -1);
    expect(typeof alwaysANumber).toEqual("number");
    const nullResult = toNegativeNumber("not_a_number");
    expect(nullResult).toBe(null);
  });

  it("throws when the default value to the schema parser helper doesn't pass schema validation", () => {
    const NegativeNumber = z.number().negative();
    const toNegativeNumber = createSchemaParser(NegativeNumber);
    // Throws because `100`, the default value, is not a negative number.
    expect(() => toNegativeNumber(1, 100)).toThrow();
  });
});
