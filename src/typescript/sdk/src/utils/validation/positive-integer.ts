import { z } from "zod";
import { parseOrNull } from "./parse-or";

const PositiveIntegerSchema = z.union([
  z.number().int().positive(),
  z
    .string()
    .refine((v) => Number.isSafeInteger(Number.parseInt(v)))
    .transform(Number)
    .refine((v) => v > 0),
  z
    .bigint()
    .positive()
    .refine((v) => Number.isSafeInteger(Number(v)))
    .transform(Number),
]);

export const toPositiveInteger = (input: unknown) => parseOrNull(PositiveIntegerSchema, input);
