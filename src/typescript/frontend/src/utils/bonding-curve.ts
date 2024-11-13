import { type AtLeastOne } from "../../../sdk/src/utils/utility-types";
import { QUOTE_REAL_CEILING, QUOTE_VIRTUAL_FLOOR } from "@sdk/const";
import Big from "big.js";

/**
 * We can check if the market is in the bonding curve by checking if the LP coin supply is 0,
 * the virtual reserves are 0, or the real reserves are greater than 0.
 * @param data, with at least one of the following:
 * - lpCoinSupply
 * - clammVirtualReservesBase
 * - clammVirtualReservesQuote
 * - cpammRealReservesBase
 * - cpammRealReservesQuote
 * @returns true if the market is in the bonding curve
 * @throws if there isn't at least one of the required fields
 */
export const isInBondingCurve = (
  data: AtLeastOne<{
    lpCoinSupply?: string | number | bigint;
    clammVirtualReservesBase?: number | bigint;
    clammVirtualReservesQuote?: number | bigint;
    cpammRealReservesBase?: number | bigint;
    cpammRealReservesQuote?: number | bigint;
  }>
): boolean => {
  const {
    lpCoinSupply,
    clammVirtualReservesBase,
    clammVirtualReservesQuote,
    cpammRealReservesBase,
    cpammRealReservesQuote,
  } = data;
  if (typeof lpCoinSupply !== "undefined") {
    return lpCoinSupply.toString() === 0n.toString();
  }
  if (clammVirtualReservesBase && clammVirtualReservesQuote) {
    return clammVirtualReservesBase === 0n && clammVirtualReservesQuote === 0n;
  }
  if (cpammRealReservesBase && cpammRealReservesQuote) {
    return cpammRealReservesBase > 0n && cpammRealReservesQuote > 0n;
  }
  throw new Error("One of the reserves must be defined.");
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
