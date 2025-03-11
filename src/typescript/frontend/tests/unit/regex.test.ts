import { BigIntTrailingNRegex, DateRegex } from "../../src/utils";

const matchesBigInt = (s: string) => BigIntTrailingNRegex.test(s);
const matchesDate = (s: string) => DateRegex.test(s);

describe("regex tests", () => {
  test.each([
    ...["0n", "1n", "-1n", "42n", "-42n"],
    "999999999999999999999999999999999999n",
    "-999999999999999999999999999999999999n",
    "1234567890123456789012345678901234567890n",
    "-1234567890123456789012345678901234567890n",
    "1000000000000000000000000000000000000000000n",
    "-1000000000000000000000000000000000000000000n",
    "18446744073709551615n",
    "-9223372036854775808n",
    "9223372036854775807n",
    "170141183460469231731687303715884105727n",
    "-170141183460469231731687303715884105728n",
    "3141592653589793238462643383279502884197n",
    "-271828182845904523536028747135266249775n",
    "9007199254740991n",
    "-9007199254740991n",
  ])("%p is a valid bigint string", (val) => {
    expect(matchesBigInt(val)).toBe(true);
    expect(() => BigInt(val.slice(0, -1))).not.toThrow();
  });

  test.each([
    ...["01", "-01", "-0000000000000012", "-1.01", 1.01, " 1n", " n", "       n"],
    ...[" ", "", " 1", "01n", "-01n", "0.0", "-0.0", [1, 2, 3], [1n], "[1n]"],
    ...["0123n", "-0123n", "n", "-n", "42", "-42", "bigInt42n", "0.5n", "-0.5n", "42N"],
  ])("%p is an invalid bigint string", (val) => {
    expect(matchesBigInt(val.toString())).toBe(false);
  });

  test.each([
    "2025-03-10T20:00:00.000Z",
    "2025-03-10T20:00:00Z",
    "2000-01-01T00:00:00.000Z",
    "1999-12-31T23:59:59.999Z",
    "1970-01-01T00:00:00.000Z",
    "1970-01-01T00:00:00.0000Z",
    "1970-01-01T00:00:00.00000Z",
    "1970-01-01T00:00:00.000000Z",
    "1970-01-01T00:00:00.000001Z",
    "1970-01-01T00:00:00.100001Z",
    "1970-01-01T00:00:00.900009Z",
    "2050-07-15T12:34:56.789Z",
    "1985-06-24T15:45:30.500Z",
    "2012-02-29T23:59:59.999Z",
    "2088-12-12T08:08:08.808Z",
    "1969-07-20T20:17:40Z",
    "2038-01-19T03:14:07.000Z",
    "2100-01-01T00:00:00Z",
    "2024-02-29T12:00:00Z",
    "1995-11-02T14:00:00.100Z",
    "2077-09-17T19:45:59.555Z",
    "2222-02-22T22:22:22.222Z",
    "1234-05-06T07:08:09.012Z",
    "3021-11-30T01:02:03.004Z",
    "1993-06-14T06:30:00.250Z",
    "2099-08-22T17:45:10.9999Z",
    "2099-08-22T17:45:10.99999Z",
    "2099-08-22T17:45:10.999999Z",
  ])("%p is a valid date string", (val) => {
    expect(matchesDate(val)).toBe(true);
    expect(new Date(val).getTime()).not.toBe(NaN);
  });

  it("returns NaN for an invalid date time", () => {
    expect(new Date("baba boo ey").getTime()).toBe(NaN);
  });

  test.each([
    "2000-01-01T20:00:00:Z",
    "2000-01-01T20:00:00.00",
    "2000-01-01 20:00:00:00",
    "2000-01-2T20:00:00:00",
    "2000-01-1T20:00:00:00",
  ])("%p is an invalid date string", (val) => {
    expect(matchesDate(val)).toBe(false);
  });
});
