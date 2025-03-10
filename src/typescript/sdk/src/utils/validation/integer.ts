import { z } from "zod";

export const IntegerSchema = z
  .number()
  .or(z.string().refine((s) => Number(s).toString() === s || s === "-0"))
  .or(z.bigint())
  .pipe(z.coerce.number().finite().safe().int());

export const PositiveIntegerSchema = IntegerSchema.pipe(z.coerce.number().positive());
