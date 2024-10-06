import { type AccountAddressInput, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  getEvents,
  getMarketResourceFromWriteSet,
  Period,
  periodEnumToRawDuration,
  rawPeriodToEnum,
  type Types,
} from "../../../src";

export const getTrackerFromWriteSet = <T extends Period>(
  res: UserTransactionResponse,
  marketAddress: AccountAddressInput,
  period: T
) => {
  const market = getMarketResourceFromWriteSet(res, marketAddress);
  const tracker = market?.periodicStateTrackers.find((t) => rawPeriodToEnum(t.period) === period);
  return tracker;
};

/**
 * Get the periodic state tracker's period expiry time by converting the start time to
 * milliseconds and adding 1 minute, then converting that to a Date object.
 *
 * @param tracker The periodic state tracker to get the period expiry for.
 * @param period The period to get the expiry for.
 * @returns The period expiry time as a Date object.
 */
export const getPeriodExpiryDate = <T extends Period>(
  tracker: Types["PeriodicStateTracker"],
  period: T
): Date => {
  // Convert from micro to milliseconds. This value is never fractional, per the smart contract.
  const millisecondStartTime = Number(tracker.startTime / 1000n);
  const periodDuration = periodEnumToRawDuration(period);
  const periodDurationMilliseconds = periodDuration.valueOf() / 1000;
  return new Date(millisecondStartTime + periodDurationMilliseconds);
};

export const getOneMinutePeriodicStateEvents = (res: UserTransactionResponse) =>
  getEvents(res).periodicStateEvents.filter(
    (e) => rawPeriodToEnum(e.periodicStateMetadata.period) === Period.Period1M
  );
