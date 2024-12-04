import { type AtLeastOne } from "./utility-types";
import { QUOTE_REAL_CEILING, QUOTE_VIRTUAL_FLOOR } from "../const";
import Big from "big.js";

/**
 * We can check if the market is in the bonding curve by checking if the LP coin supply is 0
 * or if `inBondingCurve` is explicitly set.
 * @param data, with at least one of the following:
 * - lpCoinSupply
 * - inBondingCurve
 * @returns true if the market is in the bonding curve
 * @throws if there isn't at least one of the required fields
 */
export const isInBondingCurve = ({
  lpCoinSupply,
  inBondingCurve,
}: AtLeastOne<{
  lpCoinSupply?: string | number | bigint;
  inBondingCurve?: boolean;
}>): boolean => {
  if (typeof inBondingCurve === "undefined" && typeof lpCoinSupply === "undefined") {
    throw new Error("At least one argument should be defined.");
  }

  return typeof lpCoinSupply === "undefined" ? !!inBondingCurve : BigInt(lpCoinSupply) === 0n;
};

/**
 * We can calculate the bonding curve progress percentage by taking the quote virtual reserves
 * and subtracting the virtual floor to get the total quote paid into the market, then dividing by
 * the real ceiling and multiplying by 100 to get a percentage.
 * @param clammVirtualReserves
 * @returns the percentage of the bonding curve progress
 */
export const getBondingCurveProgress = (clammVirtualReservesQuote: number | bigint) => {
  if (BigInt(clammVirtualReservesQuote) === 0n) return 100;
  return Big(clammVirtualReservesQuote.toString())
    .sub(QUOTE_VIRTUAL_FLOOR.toString())
    .div(QUOTE_REAL_CEILING.toString())
    .mul(100)
    .toNumber();
};
