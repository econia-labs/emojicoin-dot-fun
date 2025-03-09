import { type z, type ZodType } from "zod";

/**
 * Returns the parsed value if valid, otherwise returns `null`.
 */
const parseOrNull = <T extends ZodType>(schema: T, input: unknown): z.output<T> | null => {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
};

/**
 * Returns the parsed value if valid, otherwise returns the fallback value passed in, which must
 * be a type that satisfies the expected output of the schema.
 */
const parseOrFallback = <T extends ZodType>(
  schema: T,
  input: unknown,
  fallback: z.output<T>
): z.output<T> => {
  const result = schema.safeParse(input);
  return result.success ? result.data : fallback;
};

/**
 * A generically overloaded utility function to create a flexible parser for a ZodType schema.
 *
 * It allows passing optional fallback values with properly inferred return types.
 *
 * #### Note: this function performs validation on the fallback value passed and throws if it fails.
 *
 * @param schema the ZodType schema
 * @returns a function that performs validation on an `input`, with an optional `fallback`
 * returned if the input validation fails.
 * @throws if the `fallback` passed in does not pass schema validation
 *
 * @example
 * const NegativeNumberSchema = z.number().negative();
 * const toNegativeNumber = createSchemaParser(NegativeNumberSchema);
 * const alwaysANumber = toNegativeNumber("not_a_number", -1);
 * const sometimesNull = toNegativeNumber("not_a_number");
 * // Throws:
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
    return fallback !== undefined
      ? parseOrFallback(schema, input, fallback)
      : parseOrNull(schema, input);
  }

  return parser;
}
