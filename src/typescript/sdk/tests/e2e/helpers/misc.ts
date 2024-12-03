import { type AccountAddressInput, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  BASIS_POINTS_PER_UNIT,
  getEvents,
  getMarketResourceFromWriteSet,
  INTEGRATOR_FEE_RATE_BPS,
  Period,
  periodEnumToRawDuration,
  rawPeriodToEnum,
  type Types,
} from "../../../src";
import postgres from "postgres";
import Big from "big.js";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../../src/utils/test";

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

export const getDbConnection = () => {
  return postgres(process.env.DB_URL!);
};

/**
 * NOTE: This function *WILL NOT* work if the INTEGRATOR_FEE_RATE_BPS results in a fee output that
 * can only be represented with repeating decimals. The rounding errors are cumbersome to account
 * for and we will only use reasonably "nice" numbers like 100 or 250 for the integrator fee.
 *
 * Calculates the exact transition input amount including integrator fees.
 *
 * The calculation solves for the total input amount (i) given:
 * - Known exact transition amount (E) without fees
 * - Integrator fee percentage (FEE_PERCENTAGE) @see get_bps_fee in the Move contract.
 *
 * Mathematical derivation:
 * 1. E = i - (i * FEE_PERCENTAGE)    // Base equation
 * 2. E = i * (1 - FEE_PERCENTAGE)    // Factor out i
 * 3. i = E / (1 - FEE_PERCENTAGE)    // Solve for i
 *
 * Where:
 * - E = EXACT_TRANSITION_INPUT_AMOUNT
 * - i = total input amount including fees
 * - FEE_PERCENTAGE = INTEGRATOR_FEE_RATE_BPS / BASIS_POINTS_PER_UNIT
 *
 * @returns {bigint} The whole number `bigint` ceiling of the exact input amount needed to exit the
 * bonding curve, including integrator fees.
 */
export const getExactTransitionInputAmount = (
  integratorFeeRateBPs: number = INTEGRATOR_FEE_RATE_BPS
) => {
  // prettier-ignore
  const FEE_PERCENTAGE = Big(integratorFeeRateBPs)
    .div(BASIS_POINTS_PER_UNIT.toString());

  const exactAmount = Big(EXACT_TRANSITION_INPUT_AMOUNT.toString()).div(
    Big(1).minus(FEE_PERCENTAGE)
  );

  const rounded = exactAmount.round(0, Big.roundDown);

  return BigInt(rounded.toString());
};
