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

export const bigintMax = (...args: AnyNumberString[]) =>
  args.map(BigInt).reduce((max, cur) => (compareBigInt(cur, max) === 1 ? cur : max));

export const bigintMin = (...args: AnyNumberString[]) =>
  args.map(BigInt).reduce((min, cur) => (compareBigInt(cur, min) === -1 ? cur : min));
