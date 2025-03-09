import { z } from "zod";
import { createSchemaParser } from "./parse-or";

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

export const toPositiveBigInt = createSchemaParser(PositiveBigIntSchema);
