import { type Types } from "@sdk/types";
import { type AtLeastOne } from "../../../sdk/src/utils/utility-types";
import { QUOTE_REAL_CEILING, QUOTE_VIRTUAL_FLOOR } from "@sdk/const";
import Big from "big.js";

/**
 * We can check if the market is in the bonding curve by checking if the LP coin supply is 0,
 * the virtual reserves are 0, or the real reserves are greater than 0.
 * @param data, with at least one of the following:
 * - lpCoinSupply
 * - clammVirtualReserves
 * - cpammRealReserves
 * @returns true if the market is in the bonding curve
 * @throws if there isn't at least one of the required fields
 */
export const isInBondingCurve = (
  data: AtLeastOne<{
    lpCoinSupply?: string | number | bigint;
    clammVirtualReserves?: Types.Reserves;
    cpammRealReserves?: Types.Reserves;
  }>
): boolean => {
  const { lpCoinSupply, clammVirtualReserves, cpammRealReserves } = data;
  if (typeof lpCoinSupply !== "undefined") {
    return lpCoinSupply.toString() === 0n.toString();
  }
  if (clammVirtualReserves) {
    return clammVirtualReserves.base === 0n && clammVirtualReserves.quote === 0n;
  }
  if (cpammRealReserves) {
    return cpammRealReserves.base > 0n && cpammRealReserves.quote > 0n;
  }
  // The compiler should stop you from using input data that could ever get here.
  throw new Error("One of the reserves must be defined.");
};

/**
 * We can calculate the bonding curve progress percentage by taking the quote virtual reserves
 * and subtracting the virtual floor to get the total quote paid into the market, then dividing by
 * the real ceiling and multiplying by 100 to get a percentage.
 * @param clammVirtualReserves
 * @returns the percentage of the bonding curve progress
 */
export const getBondingCurveProgress = (clammVirtualReserves: Types.Reserves) => {
  return Big(clammVirtualReserves.quote.toString())
    .sub(QUOTE_VIRTUAL_FLOOR.toString())
    .div(QUOTE_REAL_CEILING.toString())
    .mul(100)
    .toNumber();
};
