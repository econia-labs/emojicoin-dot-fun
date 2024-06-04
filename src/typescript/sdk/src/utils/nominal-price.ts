/* eslint-disable import/no-unused-modules */
import { Big } from "big.js";

/* eslint-disable-next-line no-bitwise */
const Q64_BASE = Big((1n << 64n).toString());
const DECIMALS = 16;

export const toNominalPrice = (
  avgExecutionPriceQ64: string | number | bigint,
  decimals: number = DECIMALS
) => Big(avgExecutionPriceQ64.toString()).div(Q64_BASE).toFixed(decimals);

export const toQuotePrice = (
  avgExecutionPriceQ64: string | number | bigint,
  decimals: number = DECIMALS
) => Big(Q64_BASE).div(avgExecutionPriceQ64.toString()).toFixed(decimals);
