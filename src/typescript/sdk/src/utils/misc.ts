import { AccountAddress, type InputGenerateTransactionOptions } from "@aptos-labs/ts-sdk";
import Big from "big.js";
import {
  type PeriodDuration,
  type Period,
  periodEnumToRawDuration,
  toPeriodDuration,
} from "../const";
import {
  type AnyNumberString,
  type Types,
  isPeriodicStateEvent,
  isStateEvent,
  isSwapEvent,
} from "../types";

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

/**
 * This function calculates the period boundary for a swap or state event.
 * @param event
 * @param period The enum period boundary of which to calculate.
 * @returns The period boundary denoted in microseconds as a `number`.
 *
 * @example
 * ```
 * // A swap event that occurred at exactly 1 minute after the epoch event.
 * const swap = { ...someSwapEvent, time: 1n * 60n * 1000n * 1000n };
 * const periodStart = getPeriodStartTime(swap, PeriodDuration.PERIOD_1M);
 * // `periodStart` is equal to 1 minute in microseconds, i.e., 60 * 1000 * 1000.
 *
 * // If the time is one microsecond before...
 * swap.time -= 1n;
 * const periodStart = getPeriodStartTime(swap, PeriodDuration.PERIOD_1M);
 * // `periodStart` is equal to 0 minutes in microseconds.
 *
 * // One minute later...
 * swap.time += 60n * 1000n * 1000n;
 * const periodStart = getPeriodStartTime(swap, PeriodDuration.PERIOD_1M);
 * // `periodStart` is equal to 1 minute in microseconds.
 *
 * swap.time += 1n;
 * const periodStart = getPeriodStartTime(swap, PeriodDuration.PERIOD_1M);
 * // `periodStart` is equal to 2 minutes in microseconds.
 * ```
 */
export function getPeriodStartTime(
  event: Types["SwapEvent"] | Types["StateEvent"] | Types["PeriodicStateEvent"],
  periodIn: PeriodDuration | bigint | number
) {
  // All CandlestickPeriods are in microseconds.
  let time: bigint;
  if (isSwapEvent(event)) {
    time = event.time;
  } else if (isStateEvent(event)) {
    time = event.lastSwap.time;
  } else if (isPeriodicStateEvent(event)) {
    // Since periodic state events are only emitted once a period threshold
    // has been exceeded, the period boundary's emit time is completely irrelevant to
    // the event's time. The `start_time` is the actual period start for the event.
    time = event.periodicStateMetadata.startTime;
    return time;
  } else {
    throw new Error("Invalid event type, not a swap, state, or periodic state event.");
  }

  let period: PeriodDuration;
  if (typeof periodIn === "bigint" || typeof periodIn === "number") {
    const tryPeriod = toPeriodDuration(periodIn);
    if (!tryPeriod) {
      throw new Error("Invalid period passed in to period boundary calculation.");
    }
    period = tryPeriod;
  } else {
    period = periodIn;
  }

  const boundary = getPeriodStartTimeFromTime(time, period);
  return boundary;
}

/**
 * Calculate the start of a period based on a given input time and period.
 * @param microseconds the time in microseconds.
 * @param period the period to calculate the start of.
 * @returns the start of the period in microseconds.
 */
export function getPeriodStartTimeFromTime(
  microseconds: AnyNumberString,
  period: PeriodDuration | Period
) {
  const periodDuration = typeof period !== "number" ? periodEnumToRawDuration(period) : period;
  const time = BigInt(microseconds);
  // prettier-ignore
  const res = Big(time.toString())
    .div(periodDuration)
    .round(0, Big.roundDown)
    .mul(periodDuration);
  return BigInt(res.toString());
}

export function getPeriodBoundary(microseconds: AnyNumberString, period: Period): bigint {
  return getPeriodStartTimeFromTime(microseconds, period);
}

export const dateFromMicroseconds = (microseconds: bigint) =>
  new Date(Number(microseconds / 1000n));

export function getPeriodBoundaryAsDate(microseconds: AnyNumberString, period: Period): Date {
  return dateFromMicroseconds(getPeriodBoundary(microseconds, period));
}

/**
 * Truncates a hex string address to a max of 8 hex characters plus 3 periods as the ellipsis.
 * Defaults to uppercase hex characters.
 *
 * @param input the hex string to truncate
 * @param upper use lowercase hex characters, aka 0xabcd
 * @returns the truncated hex string. if < 8 characters, doesn't add spacer periods. Ensures
 * the string is returned as `0x{string}`.
 */
export const truncateAddress = (
  input: string,
  upper: boolean = true
): `0x${string}...${string}` | `0x${string}` => {
  // Catch errors due to incorrect input types- e.g., an AccountAddress instead of a string.
  try {
    const res =
      input.length < 8
        ? `${input.replace(/^0x/, "")}`
        : `${input.replace(/^(0x)?(....).*(....)$/, "$2...$3")}`;
    return `0x${upper ? res.toUpperCase() : res.toLowerCase()}`;
  } catch (e) {
    console.error(e);
    return "0x";
  }
};

export const truncateANSName = (input: string, numChars: number = 4): string => {
  if (input.length > 11) {
    const start = input.substring(0, numChars);
    const end = input.substring(input.length - numChars, input.length);
    return `${start}...${end}`;
  }
  return input;
};

/**
 * Takes an address or a name and formats it accordingly.
 */
export const formatDisplayName = (input: string) => {
  if (AccountAddress.isValid({ input, strict: false }).valid) {
    return truncateAddress(input);
  }
  return truncateANSName(input);
};

export class Lazy<T> {
  generator: () => T;

  data: T | null = null;

  constructor(generator: () => T) {
    this.generator = generator;
  }

  get(): T {
    if (this.data === null) {
      this.data = this.generator();
    }
    return this.data;
  }
}

export class LazyPromise<T> {
  generator: () => Promise<T>;

  promise: Promise<T> | null = null;

  lock: boolean = false;

  constructor(generator: () => Promise<T>) {
    this.generator = generator;
  }

  async get(): Promise<T> {
    if (this.promise === null) {
      this.promise = this.generator();
    }
    return this.promise;
  }
}

export function sum<T extends number | bigint>(array: T[]): T {
  if (typeof array[0] === "bigint") {
    return (array as bigint[]).reduce((acc, val) => acc + val, 0n) as T;
  }
  return (array as number[]).reduce((acc, val) => acc + val, 0) as T;
}

export function sumByKey<T, K extends keyof T>(array: T[], key: K): T[K] {
  const arr = array.map((x) => x[key]);
  if (typeof arr[0] === "bigint") {
    return sum(arr as Array<bigint>) as T[K];
  }
  return sum(arr as Array<number>) as T[K];
}

export function ensureArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  return [value];
}

export function zip<A, B>(a: A[], b: B[]): Array<[A, B]> {
  if (a.length !== b.length) {
    throw new Error("Arrays must have equal length.");
  }
  return Array.from({ length: a.length }).map((_, i) => [a[i], b[i]]);
}

export function enumerate<T>(arr: T[]): Array<[T, number]> {
  return zip(
    arr,
    arr.map((_, i) => i)
  );
}

/**
 * Extracts elements from an array based on a type predicate and a type guard filter function.
 *
 * This function mutates the original array, removing elements that match
 * the filter and returning them in a new array. It effectively splits
 * the input array into two based on the filter condition, returning the second array.
 *
 * @param arr - The input array to filter and extract from.
 * @param filter - A type predicate function to determine which elements to extract.
 * @returns A new array containing all elements that passed the filter, in their original order.
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5, 6];
 * const isEven = (n: number): n is number => n % 2 === 0;
 * const evenNumbers = extractFilter(numbers, isEven);
 * console.log(evenNumbers); // [2, 4, 6]
 * console.log(numbers); // [1, 3, 5]
 */
/* eslint-disable-next-line import/no-unused-modules */
export const extractFilter = <T, U extends T>(
  arr: Array<T>,
  filter: (v: T) => v is U
): Array<U> => {
  const res1 = new Array<T>();
  const res2 = new Array<U>();
  while (arr.length) {
    const val = arr.pop()!;
    if (filter(val)) {
      res2.push(val);
    } else {
      res1.push(val);
    }
  }
  while (res1.length) {
    const val = res1.pop()!;
    arr.push(val);
  }
  return res2.reverse();
};

export const DEBUG_ASSERT = (fn: () => boolean) => {
  if (process.env.NODE_ENV === "development") {
    if (!fn()) {
      throw new Error("Debug assertion failed.");
    }
  }
};

/**
 * Waits for a condition to be true, with a specified interval and maximum wait time.
 *
 * @param {() => boolean} args.condition - A function that returns true when the condition is met.
 * @param {number} args.interval - The time in milliseconds between each check of the condition.
 * @param {number} args.maxWaitTime - The maximum time in milliseconds to wait for the condition.
 * @param {boolean} [args.throwError=true] - Whether to throw an error if the condition is not met
 * within the max wait time.
 * @param {string} [args.errorMessage] - Custom error message if the wait time is exceeded. Defaults
 * to a generic message.
 *
 * @returns {Promise<boolean>} Returns the condition on the last check.
 * @throws {Error} Throws an error if the time elapsed is too large and `throwError` is true.
 *
 * @example
 * await waitFor({
 *   condition: () => someAsyncOperation(),
 *   interval: 1000,
 *   maxWaitTime: 10000,
 *   throwError: false
 * });
 */
export const waitFor = async (args: {
  condition: (() => boolean) | (() => Promise<boolean>);
  interval: number;
  maxWaitTime: number;
  throwError?: boolean;
  errorMessage?: string;
}) => {
  const {
    condition,
    interval,
    maxWaitTime,
    throwError = true,
    errorMessage = `Wait time exceeded ${maxWaitTime / 1000} seconds.`,
  } = args;

  let elapsed = 0;
  while (!(await condition()) && elapsed < maxWaitTime) {
    await sleep(interval);
    elapsed += interval;
  }
  if (await condition()) return true;
  if (throwError) throw new Error(errorMessage);
  return false;
};

/**
 * Converts an index `i` to specified sequence number options used for transaction submission.
 * @param i
 * @see InputGenerateTransactionOptions
 */
export const toSequenceNumberOptions = (
  i: number
): { options: InputGenerateTransactionOptions } => ({
  options: {
    accountSequenceNumber: i,
  },
});
