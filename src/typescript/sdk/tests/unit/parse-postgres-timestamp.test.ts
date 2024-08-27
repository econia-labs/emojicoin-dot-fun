import { postgresTimestampToMicroseconds } from "../../src/indexer-v2/types/snake-case-types";

describe("parses a postgres timestamp and ensures microsecond precision", () => {
  it("properly parses postgres timestamps to microseconds", () => {
    const one = postgresTimestampToMicroseconds("2024-08-24T19:23:01.940306");
    const two = postgresTimestampToMicroseconds("2024-08-24T19:23:01.94");
    expect(one).toEqual(1724527381940306n);
    expect(two).toEqual(1724527381940000n);
    expect(one - two).toEqual(306n);
  });

  it("properly parses the microseconds part with varying lengths", () => {
    const a = postgresTimestampToMicroseconds("2024-08-24T19:23:01.0");
    const b = postgresTimestampToMicroseconds("2024-08-24T19:23:01.00");
    const c = postgresTimestampToMicroseconds("2024-08-24T19:23:01.000");
    const d = postgresTimestampToMicroseconds("2024-08-24T19:23:01.0000");
    const e = postgresTimestampToMicroseconds("2024-08-24T19:23:01.00000");
    const f = postgresTimestampToMicroseconds("2024-08-24T19:23:01.000000");
    expect(a).toEqual(1724527381000000n);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
    expect(a).toEqual(d);
    expect(a).toEqual(e);
    expect(a).toEqual(f);
  });

  it("properly pads the microseconds part", () => {
    const firstPart = "2024-08-24T19:23:01";
    expect(postgresTimestampToMicroseconds(`${firstPart}.1`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.10`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.100`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.1000`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.10000`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.100000`)).toEqual(1724527381100000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.100001`)).toEqual(1724527381100001n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.000001`)).toEqual(1724527381000001n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.00001`)).toEqual(1724527381000010n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.0001`)).toEqual(1724527381000100n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.001`)).toEqual(1724527381001000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.01`)).toEqual(1724527381010000n);
    expect(postgresTimestampToMicroseconds(`${firstPart}.1`)).toEqual(1724527381100000n);
  });

  it("properly parses a timestamp with no microseconds", () => {
    const a = postgresTimestampToMicroseconds("2024-08-24T19:23:01");
    expect(a).toEqual(1724527381000000n);
  });
});
