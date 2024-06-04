import Big from "big.js";
import { DECIMALS } from "lib/const";

// Converts a number to its representation in coin decimals.
// Both APT and emojicoins use a fixed number of decimals: 8.
const toCoinDecimalString = (num: number | bigint | string, displayDecimals?: number): string => {
  return toCoinDecimals(num).toFixed(displayDecimals ?? 2);
};

/**
 * Convert a number FROM coin decimals. That is, multiply by 10^DECIMALS.
 * @param num
 * @returns bigint
 *
 * @example
 * fromCoinDecimals(1) // 100000000
 */
const fromCoinDecimals = (num: number | bigint | string): bigint => {
  return BigInt(
    Big(num.toString())
      .mul(Big(10 ** DECIMALS))
      .round(0)
      .toString()
  );
};

/**
 * Convert a number TO coin decimals. That is, divide by 10^DECIMALS.
 * @param num
 * @returns number
 *
 * @example
 * toCoinDecimals(100000000) // 1
 */
const toCoinDecimals = (num: number | bigint | string): number => {
  return Big(num.toString())
    .div(Big(10 ** DECIMALS))
    .toNumber();
};

export { toCoinDecimalString, toCoinDecimals, fromCoinDecimals };
