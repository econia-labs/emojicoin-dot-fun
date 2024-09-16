import { type AnyNumberString } from "../types";

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

export const bigintMax = (a: AnyNumberString, b: AnyNumberString) =>
  BigInt(compareBigInt(a, b) === 1 ? a : b);

export const bigintMin = (a: AnyNumberString, b: AnyNumberString) =>
  BigInt(compareBigInt(a, b) === -1 ? a : b);
