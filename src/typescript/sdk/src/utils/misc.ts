import { type HexInput } from "@aptos-labs/ts-sdk";
import Big from "big.js";
import { type CandlestickResolution, toCandlestickResolution } from "../const";
import { normalizeHex } from "./hex";
import {
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
 * const periodStart = getPeriodStartTime(swap, CandlestickResolution.PERIOD_1M);
 * // `periodStart` is equal to 1 minute in microseconds, i.e., 60 * 1000 * 1000.
 *
 * // If the time is one microsecond before...
 * swap.time -= 1n;
 * const periodStart = getPeriodStartTime(swap, CandlestickResolution.PERIOD_1M);
 * // `periodStart` is equal to 0 minutes in microseconds.
 *
 * // One minute later...
 * swap.time += 60n * 1000n * 1000n;
 * const periodStart = getPeriodStartTime(swap, CandlestickResolution.PERIOD_1M);
 * // `periodStart` is equal to 1 minute in microseconds.
 *
 * swap.time += 1n;
 * const periodStart = getPeriodStartTime(swap, CandlestickResolution.PERIOD_1M);
 * // `periodStart` is equal to 2 minutes in microseconds.
 * ```
 */
export function getPeriodStartTime(
  event: Types.SwapEvent | Types.StateEvent | Types.PeriodicStateEvent | Types.PeriodicStateView,
  periodIn: CandlestickResolution | bigint | number
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

  let period: CandlestickResolution;
  if (typeof periodIn === "bigint" || typeof periodIn === "number") {
    const tryPeriod = toCandlestickResolution(periodIn);
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

export function getPeriodStartTimeFromTime(microseconds: bigint, period: CandlestickResolution) {
  const time = BigInt(microseconds);
  // prettier-ignore
  const res = Big(time.toString())
    .div(period)
    .round(0, Big.roundDown)
    .mul(period);
  return BigInt(res.toString());
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
  return `${res.substring(0, numChars + 2)}...${res.substring(res.length - numChars, res.length)}`;
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

  data: T | null = null;

  constructor(generator: () => Promise<T>) {
    this.generator = generator;
  }

  async get(): Promise<T> {
    if (this.data === null) {
      this.data = await this.generator();
    }
    return this.data;
  }
}

export function sum(arr: number[]) {
  return arr.reduce((acc, val) => acc + val, 0);
}
