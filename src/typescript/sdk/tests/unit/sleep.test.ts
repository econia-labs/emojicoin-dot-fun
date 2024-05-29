import { getTime, sleep, UNIT_OF_TIME_MULTIPLIERS, UnitOfTime } from "../../src";

describe("sleep utility function with units of time", () => {
  it("converts units of time to milliseconds correctly", () => {
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Microseconds]).toEqual(0.001);
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Milliseconds]).toEqual(1);
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Seconds]).toBeCloseTo(1000, 1);
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Minutes]).toBeCloseTo(1000 * 60, 1);
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Hours]).toBeCloseTo(1000 * 60 * 60, 1);
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Days]).toBeCloseTo(1000 * 60 * 60 * 24, 1);
  });

  it("sleeps one tenth of a second for each unit of time", async () => {
    const inputs = [
      [UnitOfTime.Microseconds, 100_000],
      [UnitOfTime.Milliseconds, 100],
      [UnitOfTime.Seconds, 0.1],
      [UnitOfTime.Minutes, 0.1 / 60],
      [UnitOfTime.Hours, 0.1 / (60 * 60)],
      [UnitOfTime.Days, 0.1 / (60 * 60 * 24)],
    ] as const;

    // Note that jest screws up the `startTime` values if you don't index each start time.
    const startTimes = Array.from({ length: inputs.length }, () => 0);
    const results = inputs.map(async ([unit, amt], i) => {
      startTimes[i] = Date.now();
      return sleep(amt, unit).then(() => {
        const endTime = Date.now();
        return endTime - startTimes[i];
      });
    });
    const res = await Promise.all(results);
    res.forEach((r) => {
      // The difference between end time and start time should be less than 5 milliseconds.
      expect(r).toBeGreaterThanOrEqual(100);
      expect(r).toBeLessThanOrEqual(105);
    });
  });

  it("convert the time correctly with microsecond granularity", () => {
    const nowInDays = Date.now() / (1000 * 60 * 60 * 24);
    const res = getTime(UnitOfTime.Days);
    // If the difference is greater than 1 microsecond, then the test is invalid.
    expect((nowInDays - res) * 1_000_000).toBeLessThan(1);
  });

  it("should not overflow for 1000 years", () => {
    // In milliseconds.
    const now = Date.now();
    const aThousandYearsFromNow6 = now + UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Days] * 365 * 1000;
    expect(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Microseconds] * aThousandYearsFromNow6).toBeLessThan(
      Number.MAX_SAFE_INTEGER
    );
    expect(aThousandYearsFromNow6).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });
});
