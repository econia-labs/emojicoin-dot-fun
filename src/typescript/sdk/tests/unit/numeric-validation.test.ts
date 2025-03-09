import { z } from "zod";
import { toPositiveBigInt, toPositiveInteger } from "../../src/utils/validation";
import { parseOrDefault, asSchemaParser } from "../../src/utils/validation/parse-or";

describe("basic numeric validation", () => {
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

describe("positive bigint input validation", () => {
  test.each([
    "0",
    "-0",
    0,
    1,
    2,
    -1,
    -2,
    "-191891673921617836283721378",
    "11111111111222222222333333333333",
    "-9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999",
    "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999",
    1n,
    2n,
    3n,
    9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999n,
    -9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999n,
    0.0,
  ])("%p is properly checked as a valid, positive bigint", (num) => {
    if (BigInt(num) <= 0n) {
      expect(toPositiveBigInt(num)).toBe(null);
    } else {
      expect(toPositiveBigInt(num)).toEqual(BigInt(num));
    }
  });

  test.each([
    "01",
    "-01",
    "-0000000000000012",
    "-1.01",
    1.01,
    // Technically this can be parsed due to loss of precision, but our implementation doesn't
    // consider it valid.
    0.00000000000000000000000000000000000000000000000000000000000000000000000000000000001,
  ])("%p is an invalid bigint input", (num) => {
    expect(toPositiveBigInt(num)).toBe(null);
  });

  test.each([-999999999999999999999999n, -1n, "-2", "0", "-0", 0, -0, 0n, -0n])(
    "%p is not positive",
    (num) => {
      expect(toPositiveBigInt(num)).toBe(null);
    }
  );
  test.each([1n, 2n, 9999999999999999999999999999999999999999999999999n])(
    "%p is positive",
    (num) => {
      expect(toPositiveBigInt(num)).toBe(BigInt(num));
    }
  );

  it("ensures idempotency with non-base-10 inputs", () => {
    expect(toPositiveBigInt(0o001)).toBe(BigInt(0o001));
    expect(toPositiveBigInt("001")).toBe(null);
  });

  it("provides a default value for a zod schema", () => {
    const customPosBigIntSchema = z.bigint().positive();
    expect(parseOrDefault(customPosBigIntSchema, -1.01, 123456789n)).toEqual(123456789n);
    expect(parseOrDefault(customPosBigIntSchema, 1.01, 9999999999999n)).toEqual(9999999999999n);
    expect(toPositiveBigInt("1.01")).toBe(null);
    expect(toPositiveBigInt("1.01", 1n)).toEqual(1n);
    expect(toPositiveBigInt("1.01", 1281n)).toEqual(1281n);

    // It should deem "-12" as an invalid default value.
    expect(() => asSchemaParser(customPosBigIntSchema, "-12" as unknown as bigint)).toThrow();
    expect(() => asSchemaParser(customPosBigIntSchema, "-0" as unknown as bigint)).toThrow();
    expect(() => asSchemaParser(customPosBigIntSchema, "0" as unknown as bigint)).toThrow();
    expect(() => asSchemaParser(customPosBigIntSchema, -1n)).toThrow();

    // This should work, because 1n is a valid default positive bigint.
    expect(() => asSchemaParser(customPosBigIntSchema, 1n)).not.toThrow();
    const withDefault = asSchemaParser(customPosBigIntSchema, 1n);
    const withoutDefault = asSchemaParser(customPosBigIntSchema);

    expect(withDefault("not_a_bigint")).toEqual(1n);
    expect(withDefault(2n)).toEqual(2n);
    expect(withoutDefault("not_a_bigint")).toBe(null);
    expect(withoutDefault(7n)).toBe(7n);
  });

  it("uses the schema parser helper with a simple example", () => {
    const NegativeNumberSchema = z.number().negative();
    const toNegativeNumber = (n?: number) => n ? asSchemaParser(NegativeNumberSchema, n) : asSchemaParser(NegativeNumberSchema);
    const myDefaultWIthOne = asSchemaParser(NegativeNumberSchema, 12);
    const res = myDefaultWIthOne(12);

    const alwaysANumber = toNegativeNumber("not_a_number", -1);
    const sometimesNull = toNegativeNumber("not_a_number");
    const willThrowAtRuntime = toNegativeNumber("not_a_number", 100);
  });
});
