import { postgresTimestampToDate, postgresTimestampToMicroseconds } from "../../src/indexer-v2";
import { safeParseBigIntOrPostgresTimestamp } from "../../src/types/arena-types";

describe("ensures it's possible to safely parse a bigint or a postgres timestamp input", () => {
  it("parses a bigint", () => {
    const nowMs = Date.now();
    const nowBigInt = BigInt(nowMs * 1000);
    const parsed = safeParseBigIntOrPostgresTimestamp(nowBigInt);
    expect(parsed.getTime()).toEqual(nowMs);
  });

  it("parses a postgres timestamp", () => {
    const nowPostgresTimestamp = postgresTimestampToDate("2024-08-24T19:23:01.94");
    const nowPostgresTimestampAsBigInt = postgresTimestampToMicroseconds("2024-08-24T19:23:01.94");
    const parsedBigIntToTimestamp = safeParseBigIntOrPostgresTimestamp(
      nowPostgresTimestampAsBigInt
    );
    expect(nowPostgresTimestamp.getTime()).toEqual(parsedBigIntToTimestamp.getTime());
  });
});
