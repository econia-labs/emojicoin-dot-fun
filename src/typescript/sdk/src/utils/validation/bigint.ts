import { z } from "zod";

/**
 * Accepts integer-like numbers, bigints, and numeric strings that possibly end with "n".
 */
export const BigIntSchema = z
  .bigint()
  .or(z.number())
  .or(
    z
      .string()
      .transform((s) => (s.endsWith("n") ? s.slice(0, -1) : s))
      .pipe(
        z.coerce
          .string()
          .regex(/^-?[1-9]\d*$/, "Must be a valid integer string with no leading zeros")
          .or(z.coerce.string().refine((s) => s === "0" || s === "-0"))
      )
  )
  .pipe(z.coerce.bigint());

export const PositiveBigIntSchema = BigIntSchema.pipe(z.coerce.bigint().positive());
