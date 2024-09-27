import { type AnyNumberString } from "../types";
import { zip } from "./misc";

// By default, sorts by descending, aka [1n, 0n] becomes [0n, 1n] with this comparator function.
export const compareBigInt = (a: AnyNumberString, b: AnyNumberString): 0 | -1 | 1 => {
  const [aa, bb] = [BigInt(a), BigInt(b)];
  if (aa > bb) {
    return 1;
  }
  if (aa < bb) {
    return -1;
  }
  return 0;
};

export const maxBigInt = (...args: AnyNumberString[]): bigint => {
  if (typeof args === "undefined" || args.length === 0) {
    throw new Error("Array must contain at least one bigint.");
  }
  return args.map(BigInt).reduce((max, cur) => (compareBigInt(cur, max) === 1 ? cur : max));
};

export const minBigInt = (...args: AnyNumberString[]): bigint => {
  if (typeof args === "undefined" || args.length === 0) {
    throw new Error("Array must contain at least one bigint.");
  }
  return args.map(BigInt).reduce((min, cur) => (compareBigInt(cur, min) === -1 ? cur : min));
};

export const sortBigIntArrays = (arrA: bigint[], arrB: bigint[]): 0 | -1 | 1 => {
  for (const [a, b] of zip(arrA, arrB)) {
    const cmp = compareBigInt(a, b);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return 0;
};
