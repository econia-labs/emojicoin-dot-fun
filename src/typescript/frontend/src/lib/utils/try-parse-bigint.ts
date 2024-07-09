import { type AnyNumberString } from "@sdk-types";

const parseBigInt = (value: AnyNumberString): bigint | null => {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

export default parseBigInt;
