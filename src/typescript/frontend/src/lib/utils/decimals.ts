import { divideWithPrecision } from "@/sdk/utils/misc";
import { DECIMALS } from "lib/const";

const toDecimalsAPT = (n: number | bigint, displayDecimals?: number): string => {
  const num = divideWithPrecision({
    a: n,
    b: Math.pow(10, DECIMALS),
    decimals: displayDecimals ?? 2,
  });
  return num.toFixed(displayDecimals ?? 2);
};

export { toDecimalsAPT };
