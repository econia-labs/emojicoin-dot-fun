// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
export enum UnitOfTime {
  Microseconds,
  Milliseconds,
  Seconds,
  Minutes,
  Hours,
  Days,
  Weeks,
}

// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
// NOTE: This specifically for converting from a UnitOfTime to milliseconds.
export const UNIT_OF_TIME_MULTIPLIERS: Record<UnitOfTime, number> = {
  [UnitOfTime.Microseconds]: 1 / 1000,
  [UnitOfTime.Milliseconds]: 1,
  [UnitOfTime.Seconds]: 1000,
  [UnitOfTime.Minutes]: 1000 * 60,
  [UnitOfTime.Hours]: 1000 * 60 * 60,
  [UnitOfTime.Days]: 1000 * 60 * 60 * 24,
  [UnitOfTime.Weeks]: 1000 * 60 * 60 * 24 * 7,
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
 * const time = getTime(UnitOfTime.Seconds);
 * // `time` is the number of seconds since the Unix epoch.
 * const time = getTime(UnitOfTime.Days);
 * // `time` is the number of days since the Unix epoch.
 * ```
 */
export function getTime(unitOfTime: UnitOfTime) {
  return Date.now() / UNIT_OF_TIME_MULTIPLIERS[unitOfTime];
}
