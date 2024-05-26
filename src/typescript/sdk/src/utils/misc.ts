import { type CandlestickResolution } from "../const";

// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
export enum UnitOfTime {
  Microseconds,
  Milliseconds,
  Seconds,
  Minutes,
  Hours,
  Days,
}

// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
export const UNIT_OF_TIME_MULTIPLIERS: Record<UnitOfTime, number> = {
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
 * This is a helper function to specify the unit of time for `Date.now()`.
 *
 * Note that this function returns a fractional, floating point value.
 *
 * @param unitOfTime {@link UnitOfTime}
 * @returns the elapsed {@link UnitOfTime} since the Unix epoch, as a floating point number.
 *
 * @example
 * ```
 * const time = now(UnitOfTime.Seconds);
 * // `time` is the number of seconds since the Unix epoch.
 * const time = now(UnitOfTime.Days);
 * // `time` is the number of days since the Unix epoch.
 * ```
 */
export function getTime(unitOfTime: UnitOfTime) {
  return Date.now() * UNIT_OF_TIME_MULTIPLIERS[unitOfTime];
}

export function getCurrentPeriodBoundary(period: CandlestickResolution) {
  // All CandlestickPeriods are in microseconds.
  return Math.floor(getTime(UnitOfTime.Microseconds) / period) * period;
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
