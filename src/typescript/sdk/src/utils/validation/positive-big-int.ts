import { z } from "zod";
import { parseOrDefault, parseOrNull } from "./parse-or";

const PositiveBigIntSchema = z.union([
  z.bigint().positive(),
  z
    .number()
    .int()
    .positive()
    .transform((n) => BigInt(n)),
  z
    .string()
    .regex(/^[1-9]\d*$/, "Must be a valid, positive integer string with no leading zeros")
    .transform((s) => BigInt(s)),
]);

// export const toPositiveBigInt = (input: unknown) => parseOrNull(PositiveBigIntSchema, input);
export function toPositiveBigInt(input: unknown, defaultValue: bigint): bigint;
export function toPositiveBigInt(input: unknown, defaultValue?: undefined): bigint | null;
export function toPositiveBigInt(input: unknown, defaultValue?: bigint): bigint | null {
  if (defaultValue !== undefined) {
    return parseOrDefault(PositiveBigIntSchema, input, defaultValue);
  }
  return parseOrNull(PositiveBigIntSchema, input);
}
