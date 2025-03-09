import { z } from "zod";
import { toPositiveBigInt, toPositiveInteger } from "../../src/utils/validation";
import { createSchemaParser } from "../../src/utils/validation";

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

  it("provides a default value for zod schemas", () => {
    expect(toPositiveBigInt("1.01")).toBe(null);
    expect(toPositiveBigInt("1.01", 1n)).toEqual(1n);
    expect(toPositiveBigInt("1.01", 1281n)).toEqual(1281n);
    expect(toPositiveInteger("-1", 10)).toEqual(10);
    expect(toPositiveInteger("1", 10)).toEqual(1);
    expect(toPositiveInteger(-0, 77)).toEqual(77);
    expect(toPositiveInteger(-100, 100)).toEqual(100);
  });

  it("should throw when an invalid default value is passed", () => {
    const customPosBigIntSchema = z.bigint().positive();
    const parser = createSchemaParser(customPosBigIntSchema);

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
    const NegativeNumberSchema = z.number().negative();
    const toNegativeNumber = createSchemaParser(NegativeNumberSchema);
    const alwaysANumber = toNegativeNumber("not_a_number", -1);
    expect(typeof alwaysANumber).toEqual("number");
    const nullResult = toNegativeNumber("not_a_number");
    expect(nullResult).toBe(null);

    // Throws because `100`, the default value, is not a negative number.
    expect(() => toNegativeNumber(1, 100)).toThrow();
  });
});
