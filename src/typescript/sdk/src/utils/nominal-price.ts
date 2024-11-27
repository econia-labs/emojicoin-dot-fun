/* eslint-disable import/no-unused-modules */
import { Big } from "big.js";

/* eslint-disable-next-line no-bitwise */
const Q64_BASE = Big((Big(2).pow(64)).toString());
const DECIMALS = 16;

export const q64ToBig = (q64: string | number | bigint) => Big(q64.toString()).div(Q64_BASE);

export const toNominalPrice = (
  avgExecutionPriceQ64: string | number | bigint,
  decimals: number = DECIMALS
) => Number(q64ToBig(avgExecutionPriceQ64).toFixed(decimals));

export const toQuotePrice = (
  avgExecutionPriceQ64: string | number | bigint,
  decimals: number = DECIMALS
) => Number(Big(Q64_BASE).div(avgExecutionPriceQ64.toString()).toFixed(decimals));
