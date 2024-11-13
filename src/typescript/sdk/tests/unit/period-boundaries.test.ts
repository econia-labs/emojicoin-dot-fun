import { PERIODS, PeriodDuration, getPeriodStartTime } from "../../src";
import { calculatePeriodBoundariesCrossed } from "../../src/utils/test";
import { SAMPLE_STATE_EVENT, SAMPLE_SWAP_EVENT } from "../../src/utils/test/sample-data";

const swap = SAMPLE_SWAP_EVENT;
const state = SAMPLE_STATE_EVENT;
const epoch = new Date(0);
const epochInMicroseconds = BigInt(epoch.getTime() * 1000);

const microsecondFactor = 10n ** 6n;

const { PERIOD_1M } = PeriodDuration;
const { PERIOD_5M } = PeriodDuration;
const { PERIOD_15M } = PeriodDuration;
const { PERIOD_30M } = PeriodDuration;
const { PERIOD_1H } = PeriodDuration;
const { PERIOD_4H } = PeriodDuration;
const { PERIOD_1D } = PeriodDuration;

describe("tests period boundaries", () => {
  it("calculates the first period boundary ever for a swap event", () => {
    swap.time = epochInMicroseconds;
    expect(getPeriodStartTime(swap, PERIOD_1D) === 0n * BigInt(PERIOD_1D)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_4H) === 0n * BigInt(PERIOD_4H)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_1H) === 0n * BigInt(PERIOD_1H)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
  });

  it("calculates the first period boundary ever for a state event", () => {
    state.lastSwap.time = epochInMicroseconds;
    expect(getPeriodStartTime(state, PERIOD_1D) === 0n * BigInt(PERIOD_1D)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_4H) === 0n * BigInt(PERIOD_4H)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_1H) === 0n * BigInt(PERIOD_1H)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
  });

  it("calculates various period boundaries for a swap event", () => {
    swap.time = epochInMicroseconds;
    // Exactly at the period boundary.
    swap.time += 60n * microsecondFactor;

    // Put it right before the next period boundary.
    swap.time -= 1n;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 1n;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 1n;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    swap.time += 60n * microsecondFactor;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 2n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 3 minutes.
    swap.time += 3n * 60n * microsecondFactor;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 5n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 1n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 10 minutes.
    swap.time += 10n * 60n * microsecondFactor;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 15n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 3n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_15M) === 1n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);

    // Subtract 1 second.
    swap.time -= 1n * microsecondFactor;
    expect(getPeriodStartTime(swap, PERIOD_1M) === 14n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_5M) === 2n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(swap, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
  });

  it("calculates various period boundaries for a state event", () => {
    state.lastSwap.time = epochInMicroseconds;
    // Exactly at the period boundary.
    state.lastSwap.time += 60n * microsecondFactor;

    // Put it right before the next period boundary.
    state.lastSwap.time -= 1n;
    expect(getPeriodStartTime(state, PERIOD_1M) === 0n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 1n;
    expect(getPeriodStartTime(state, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 1n;
    expect(getPeriodStartTime(state, PERIOD_1M) === 1n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    state.lastSwap.time += 60n * microsecondFactor;
    expect(getPeriodStartTime(state, PERIOD_1M) === 2n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 0n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 3 minutes.
    state.lastSwap.time += 3n * 60n * microsecondFactor;
    expect(getPeriodStartTime(state, PERIOD_1M) === 5n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 1n * BigInt(PERIOD_5M)).toEqual(true);

    // Add 10 minutes.
    state.lastSwap.time += 10n * 60n * microsecondFactor;
    expect(getPeriodStartTime(state, PERIOD_1M) === 15n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 3n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_15M) === 1n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);

    // Subtract 1 second.
    state.lastSwap.time -= 1n * microsecondFactor;
    expect(getPeriodStartTime(state, PERIOD_1M) === 14n * BigInt(PERIOD_1M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_5M) === 2n * BigInt(PERIOD_5M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_15M) === 0n * BigInt(PERIOD_15M)).toEqual(true);
    expect(getPeriodStartTime(state, PERIOD_30M) === 0n * BigInt(PERIOD_30M)).toEqual(true);
  });
});

describe("calculates period boundaries crossed", () => {
  type TwoNumbers = `${number}${number}`;
  type TimeFormat = `${TwoNumbers}:${TwoNumbers}:${TwoNumbers}`;
  const defaultDate = "01-01-2000";
  const getUTCDateFromHMS = (time: TimeFormat) => new Date(`${defaultDate} ${time}Z`);
  // Converts hours:minutes:seconds to the number of microseconds since the Unix epoch using a
  // default date for the day, month and year.
  const getMicrosecondsFromHMS = (time: TimeFormat) =>
    BigInt(getUTCDateFromHMS(time).getTime() * 1000);

  it("uses the same date by default with the utility function", () => {
    const times: Array<TimeFormat> = ["00:00:00", "11:59:59", "12:00:00", "23:59:59"];
    times.forEach((time) => {
      const utcDate = getUTCDateFromHMS(time);
      expect(utcDate.getUTCDate()).toEqual(1);
      expect(utcDate.getUTCMonth()).toEqual(0); // getUTCMonth() is offset by 0; December is 11.
      expect(utcDate.getUTCFullYear()).toEqual(2000);
      const micros = getMicrosecondsFromHMS(time);
      expect(
        calculatePeriodBoundariesCrossed({ startMicroseconds: micros, endMicroseconds: micros })
      ).toEqual(0);
      const date = new Date(Number(micros / 1000n));
      expect(date.getUTCDate()).toEqual(1);
      expect(date.getUTCMonth()).toEqual(0); // getUTCMonth() is offset by 0; December is 11.
      expect(date.getUTCFullYear()).toEqual(2000);
    });
  });

  it("calculates that no period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:01:13");
    const endMicroseconds = getMicrosecondsFromHMS("01:01:59");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(0);
  });

  it("calculates that a 1 minute period boundary is crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:01:13");
    const endMicroseconds = getMicrosecondsFromHMS("01:02:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(1);
  });

  it("calculates that 1m and 5m period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:04:59");
    const endMicroseconds = getMicrosecondsFromHMS("01:05:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(2);
  });

  it("calculates that 1m, 5m, and 15m period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:14:59");
    const endMicroseconds = getMicrosecondsFromHMS("01:15:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(3);
  });

  it("calculates that 1m, 5m, 15m, and 30m period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:29:59");
    const endMicroseconds = getMicrosecondsFromHMS("01:30:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(4);
  });

  it("calculates that 1m, 5m, 15m, 30m, and 1h period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:59:59");
    const endMicroseconds = getMicrosecondsFromHMS("02:00:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(5);
  });

  it("calculates that 1m, 5m, 15m, 30m, 1h, and 4h period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("03:59:59");
    const endMicroseconds = getMicrosecondsFromHMS("04:00:00");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(6);
  });

  it("calculates that all period boundaries are crossed", () => {
    const startMicroseconds = getMicrosecondsFromHMS("23:59:59");
    const oneDay = BigInt(PeriodDuration.PERIOD_1D);
    const endMicroseconds = getMicrosecondsFromHMS("00:00:00") + oneDay;
    const startDay = new Date(Number(startMicroseconds / 1000n)).getUTCDate();
    const endDay = new Date(Number(endMicroseconds / 1000n)).getUTCDate();
    expect(startDay + 1).toEqual(endDay);
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(PERIODS.length);
  });

  it("calculates that exactly only 1 period boundary is crossed over a 4m59s time period", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:00:00");
    const endMicroseconds = getMicrosecondsFromHMS("01:04:59");
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(1);
  });

  it("calculates that exactly 7 period boundaries are crossed over multiple days", () => {
    const startMicroseconds = getMicrosecondsFromHMS("01:01:13");
    const threeDays = BigInt(PeriodDuration.PERIOD_1D) * 3n;
    const endMicroseconds = getMicrosecondsFromHMS("01:02:00") + threeDays;
    const startDay = new Date(Number(startMicroseconds / 1000n)).getUTCDate();
    const endDay = new Date(Number(endMicroseconds / 1000n)).getUTCDate();
    expect(startDay + 3).toEqual(endDay);
    const numBoundaries = calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(numBoundaries).toEqual(7);
    expect(numBoundaries).toEqual(PERIODS.length);
  });

  it("throws if the end time is later than the start time", () => {
    const startMicroseconds = new Date("01-01-2000 00:00:01Z").getTime() * 1000;
    const endMicroseconds = new Date("01-01-2000 00:00:00Z").getTime() * 1000;
    const fn = () => calculatePeriodBoundariesCrossed({ startMicroseconds, endMicroseconds });
    expect(fn).toThrow();
  });
});
