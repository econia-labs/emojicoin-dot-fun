/* eslint-disable import/no-unused-modules */
import { Big } from "big.js";
import { DECIMALS } from "../const";

/* eslint-disable-next-line no-bitwise */
const Q64_BASE = Big(Big(2).pow(64).toString());
const DEFAULT_PRICE_DECIMALS = 16;

export const q64ToBig = (q64: string | number | bigint) => Big(q64.toString()).div(Q64_BASE);

export const toNominalPrice = (
  avgExecutionPriceQ64: string | number | bigint,
  decimals: number = DEFAULT_PRICE_DECIMALS
) => Number(q64ToBig(avgExecutionPriceQ64).toFixed(decimals));

export const toQ64Big = (input: string | number | bigint) => Big(input.toString()).mul(Q64_BASE);

/**
 * Returns the decimalized amount of APT or emojicoin.
 *
 * Works with any coin that uses {@link DECIMALS} decimals.
 *
 * @param num a bigint representing a coin balance
 * @returns the nominal number value
 * @example
 * const res = toNominalCoinValue(100_000_000n);
 * // res === 1.1
 * expect(res).toBe(1.1);
 */
export const toNominal = (num: bigint) => new Big(num.toString()).div(10 ** DECIMALS).toNumber();
