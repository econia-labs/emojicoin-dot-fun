import { AccountAddress, type HexInput } from "@aptos-labs/ts-sdk";
import Big from "big.js";
import {
  type PeriodDuration,
  type Period,
  periodEnumToRawDuration,
  toPeriodDuration,
} from "../const";
import { normalizeHex } from "./hex";
import {
  type AnyNumberString,
  type Types,
  isAnyEmojiCoinEvent,
  isPeriodicStateEvent,
  isPeriodicStateView,
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
  event: Types.SwapEvent | Types.StateEvent | Types.PeriodicStateEvent | Types.PeriodicStateView,
  periodIn: PeriodDuration | bigint | number
) {
  // All CandlestickPeriods are in microseconds.
  let time: bigint;
  if (isAnyEmojiCoinEvent(event)) {
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
  } else if (isPeriodicStateView(event)) {
    time = BigInt(event.startTime);
  } else {
    throw new Error("Invalid event type.");
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

export const ADDRESS_FULL_CHAR_LENGTH = 64;

export const truncateAddress = (input: HexInput, numChars: number = 4): string => {
  let s;
  if (typeof input === "string") {
    if (input.startsWith("0x")) {
      s = input.slice(2);
    } else {
      s = input;
    }
    if (s.length < ADDRESS_FULL_CHAR_LENGTH) {
      s = "0".repeat(ADDRESS_FULL_CHAR_LENGTH - s.length) + s;
    }
    s = `0x${s}`;
  } else {
    s = input;
  }
  const res = normalizeHex(s);
  const start = res.substring(0, numChars + 2);
  const end = res.substring(res.length - numChars, res.length);
  return `${start}...${end}`;
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
    return `0x${truncateAddress(input).substring(2).toUpperCase()}`;
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
