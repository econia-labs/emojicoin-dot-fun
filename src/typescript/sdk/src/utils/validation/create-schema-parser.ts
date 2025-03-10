import { type z, type ZodType } from "zod";

/**
 * A generically overloaded utility function to create a flexible parser for a ZodType schema.
 * Allows passing optional fallback values with properly inferred return types.
 *
 * `.catch()` extends the underlying schema, whereas this is just a way to make utility functions.
 *
 * #### Note: this function performs validation on the fallback value passed and throws if it fails.
 *
 * @example
 * const NegativeNumberSchema = z.number().negative();
 * const toNegativeNumber = createSchemaParser(NegativeNumberSchema);
 *
 * const alwaysANumber = toNegativeNumber("not_a_number", -1);
 * const sometimesNull = toNegativeNumber("not_a_number");
 *
 * // Will throw an error at runtime:
 * const willThrowAtRuntime = toNegativeNumber("not_a_number", 1);
 * const willAlsoThrow = toNegativeNumber(-1, 1);
 */
export function createSchemaParser<T extends ZodType>(schema: T) {
  function parser(input: unknown, fallback: z.output<T>): z.output<T>;
  function parser(input: unknown, fallback?: undefined): z.output<T> | null;
  function parser(input: unknown, fallback?: z.output<T>): z.output<T> | null {
    if (fallback !== undefined) {
      const result = schema.safeParse(fallback);
      if (!result.success) {
        throw new Error(`Invalid fallback value passed to ${schema}: ${fallback}`);
      }
    }
    const result = schema.safeParse(input);
    if (result.success) {
      return result.data;
    }
    return fallback ?? null;
  }

  return parser;
}
