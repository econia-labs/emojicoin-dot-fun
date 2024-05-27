import { divideWithPrecision } from "@/sdk/utils/misc";
import { DECIMALS } from "lib/const";

const toDecimalsAPT = (input: number | bigint | string, displayDecimals?: number): string => {
  let n: number | bigint;
  if (typeof input === "string") {
    n = BigInt(input);
  } else {
    n = input;
  }
  const num = divideWithPrecision({
    a: n,
    b: Math.pow(10, DECIMALS),
    decimals: displayDecimals ?? 2,
  });
  return num.toFixed(displayDecimals ?? 2);
};

export { toDecimalsAPT };
