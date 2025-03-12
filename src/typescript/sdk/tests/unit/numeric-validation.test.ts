import { Schemas } from "../../src";

const toInteger = (input: unknown) => Schemas["Integer"].safeParse(input).data;
const toPositiveInteger = (input: unknown) => Schemas["PositiveInteger"].safeParse(input).data;
const toBigInt = (input: unknown) => Schemas["BigInt"].safeParse(input).data;
const toPositiveBigInt = (input: unknown) => Schemas["PositiveBigInt"].safeParse(input).data;

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
    expect(parsed).not.toBe(undefined);
    if (parsed > 0) {
      expect(toPositiveInteger(input)).toEqual(parsed);
    } else {
      expect(toPositiveInteger(input)).toBe(undefined);
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

  test.each([0, -0, -1, -2, -3, -4, -5, "-0"].flatMap((v) => [Number(v), String(v), BigInt(v)]))(
    "%p is not a positive integer",
    (num) => {
      expect(toPositiveInteger(num)).toBe(undefined);
    }
  );
});

test.each(
  [
    ...[0, 1, 2, 0.0, "100", "101", "458237465832657", "86238628463838234847484287423843874"],
    "999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999",
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
  expect(result).not.toBe(undefined);
  if (typeof input === "string" && input.endsWith("n")) {
    expect(result).toEqual(BigInt(input.slice(0, -1)));
  }
  if (result <= 0n) {
    expect(toPositiveBigInt(input)).toBe(undefined);
  } else {
    expect(toPositiveBigInt(input)).toEqual(result);
  }
});

test.each([1.234e10, 100.5e6, Number.MAX_SAFE_INTEGER, -11.142e12])(
  "%s is a valid integer",
  (input) => {
    const result = toInteger(input)!;
    expect(result).not.toBe(undefined);
    expect(result / 10).toEqual(Number(input) / 10);
    expect(result - 1).toEqual(Number(input) - 1);
    expect(result - 1).toEqual(Number(input) - 1);
  }
);

test.each([1.123e100, 1.4e50, "1182361283683863837244"])("%s is an invalid integer", (input) => {
  const result = toInteger(input)!;
  expect(result).toBe(undefined);
});

test.each([1.234e10, 100.5e20, -123.412123675127353e30, Number.MAX_VALUE])(
  "%p is a valid bigint",
  (input) => {
    const result = toBigInt(input)!;
    expect(result).not.toBe(undefined);
    expect(result * 10n).toEqual(BigInt(input) * 10n);
    expect(result - 1n).toEqual(BigInt(input) - 1n);
    expect(result - 1n).toEqual(BigInt(input) - 1n);
  }
);

it("doesn't prematurely lose precision due to the parsing function", () => {
  const maxValue = Number.MAX_VALUE;
  const result = toBigInt(maxValue)!;
  expect(result).not.toBe(undefined);
  expect(result - 1n).toEqual(BigInt(maxValue) - 1n);

  // Note that this *does* lose precision:
  expect(toBigInt(maxValue - 1)).not.toEqual(result - 1n);
  expect(toBigInt(maxValue - 1)).not.toEqual(BigInt(maxValue) - 1n);
});

test.each([1.234e2, 1.23456e3, 1.23456789341723e5])(
  "%p is not a valid integer or bigint",
  (input) => {
    const result = toBigInt(input);
    expect(result).toBe(undefined);
    const result2 = toInteger(input);
    expect(result2).toBe(undefined);
  }
);

test.each([
  ...["01", "-01", "-0000000000000012", "-1.01", 1.01, " 1n", " n", "       n"],
  ...[" ", "", " 1", "01n", "-01n", "0.0", "-0.0", [1, 2, 3], [1n], "[1n]"],
  ...["0123n", "-0123n", "n", "-n", "42 ", "-42 ", "bigInt42n", "0.5n", "-0.5n", "42N"],
  0.00000000000000000000000000000000000000000000000000000000000000000000000000000000001,
  "0.00000000000000000000000000000000000000000000000000000000000000000000000000000000001",
])("%p is an invalid integer input", (num) => {
  expect(toInteger(num)).toBe(undefined);
  expect(toBigInt(num)).toBe(undefined);
});

describe("bigint input validation", () => {
  it("ensures idempotency with non-base-10 inputs", () => {
    expect(toPositiveBigInt(0o001)).toBe(BigInt(0o001));
    expect(toPositiveBigInt("001")).toBe(undefined);
  });
});
