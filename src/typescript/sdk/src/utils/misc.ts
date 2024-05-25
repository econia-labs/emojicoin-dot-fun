import { type CandlestickResolution } from "../const";

/**
 * Sleep the current thread for the given amount of time
 * @param timeMs time in milliseconds to sleep
 */
export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

export enum TimeUnits {
  nanoseconds,
  microseconds,
  milliseconds,
  seconds,
  minutes,
  hours,
  days,
}

const TIME_UNIT_FACTORS: Map<TimeUnits, number> = new Map([
  [TimeUnits.nanoseconds, 1_000_000],
  [TimeUnits.microseconds, 1_000],
  [TimeUnits.milliseconds, 1],
  [TimeUnits.seconds, 1 / 1000],
  [TimeUnits.minutes, 1 / (1000 * 60)],
  [TimeUnits.hours, 1 / (1000 * 60 * 60)],
  [TimeUnits.days, 1 / (1000 * 60 * 60 * 24)],
]);

/**
 *
 * The number of <TimeUnits> since the Unix epoch. Note that this function returns a floating point.
 *
 * @param granularity
 * @returns the floating point value of <TimeUnits> since the Unix epoch.
 *
 * @example
 * ```
 * const time = now(TimeUnits.sec);
 * // `time` is the number of seconds since the Unix epoch.
 * const time = now(TimeUnits.day);
 * // `time` is the number of days since the Unix epoch.
 * ```
 */
export function now(granularity: TimeUnits) {
  if (!TIME_UNIT_FACTORS.has(granularity)) {
    throw new Error(`Invalid granularity: ${granularity}`);
  }
  return Date.now() * TIME_UNIT_FACTORS.get(granularity)!;
}

export function getCurrentPeriodBoundary(period: CandlestickResolution) {
  // All CandlestickPeriods are in microseconds.
  const granularity = TimeUnits.microseconds;
  return Math.floor(now(granularity) / period) * period;
}

export const divideWithPrecision = (args: {
  a: bigint | number;
  b: bigint | number;
  decimals: number;
}): number => {
  const { decimals } = args;
  const a = BigInt(args.a);
  const b = BigInt(args.b);
  const f = BigInt(10 ** decimals);
  return Number((a * f) / b) / Number(f);
};
