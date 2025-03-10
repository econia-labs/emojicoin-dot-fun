import { z } from "zod";
import { createSchemaParser } from "./create-schema-parser";

export const IntegerSchema = z
  .number()
  .or(z.string().refine((s) => Number(s).toString() === s || s === "-0"))
  .or(z.bigint())
  .pipe(z.coerce.number().finite().safe().int());

/**
 * A parsing function that accepts inputs that resemble finite and Number.isSafeInteger(n) integers.
 */
export const toInteger = createSchemaParser(IntegerSchema);
