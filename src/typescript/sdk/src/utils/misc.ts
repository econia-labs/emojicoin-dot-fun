import { type CandlestickResolution } from "../const";

export enum UnitOfTime {
  Nanoseconds,
  Microseconds,
  Milliseconds,
  Seconds,
  Minutes,
  Hours,
  Days,
}

const UNIT_OF_TIME_MULTIPLIERS: Record<UnitOfTime, number> = {
  [UnitOfTime.Nanoseconds]: 1_000_000,
  [UnitOfTime.Microseconds]: 1_000,
  [UnitOfTime.Milliseconds]: 1,
  [UnitOfTime.Seconds]: 1 / 1000,
  [UnitOfTime.Minutes]: 1 / (1000 * 60),
  [UnitOfTime.Hours]: 1 / (1000 * 60 * 60),
  [UnitOfTime.Days]: 1 / (1000 * 60 * 60 * 24),
};

/**
 * Sleep the current thread for the given amount of time, with an optional specifier
 * for the unit of time.
 *
 *
 * @param amount the numeric amount of time to sleep
 * @param unitOfTime the unit of time to sleep for
 * @default unitOfTime milliseconds.
 *
 */
export async function sleep(
  amount: number,
  unitOfTime: UnitOfTime = UnitOfTime.Milliseconds
): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, amount * UNIT_OF_TIME_MULTIPLIERS[unitOfTime]);
  });
}

/**
 *
 * The number of <TimeUnits> since the Unix epoch. Note that this function returns a floating point.
 *
 * @param unitOfTime
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
export function now(unitOfTime: UnitOfTime) {
  return Date.now() * UNIT_OF_TIME_MULTIPLIERS[unitOfTime];
}

export function getCurrentPeriodBoundary(period: CandlestickResolution) {
  // All CandlestickPeriods are in microseconds.
  return Math.floor(now(UnitOfTime.Microseconds) / period) * period;
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
