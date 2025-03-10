import { z } from "zod";
import { createSchemaParser } from "./parse-or";

export const IntegerSchema = z
  .number()
  .or(z.string().refine((s) => (Number(s).toString() === s) || s === "-0"))
  .or(z.bigint())
  .pipe(z.coerce.number().finite().safe().int());

/**
 * A parsing function that accepts number, bigint, and string inputs that resemble numbers or
 * bigint values.
 *
 * @see {@link parseBigInt}
 */
export const toInteger = createSchemaParser(IntegerSchema);
