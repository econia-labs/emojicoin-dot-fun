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

export function sum(arr: number[]) {
  return arr.reduce((acc, val) => acc + val, 0);
}
