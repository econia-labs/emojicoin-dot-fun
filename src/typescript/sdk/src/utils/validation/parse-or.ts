import { type z, type ZodType } from "zod";

/**
 * Returns the parsed value if valid, otherwise returns `null`.
 */
export const parseOrNull = <T extends ZodType>(schema: T, input: unknown): z.output<T> | null => {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
};

/**
 * Returns the parsed value if valid, otherwise returns the default value passed in, which must
 * be a type that satisfies the expected output of the schema.
 */
export const parseOrDefault = <T extends ZodType>(
  schema: T,
  input: unknown,
  defaultValue: z.output<T>
): z.output<T> => {
  const result = schema.safeParse(input);
  return result.success ? result.data : defaultValue;
};

/**
 * A generically overloaded utility function that creates a flexible parser for a schema that
 * allows passing optional default values with properly inferred return types.
 *
 * @example
 * const NegativeNumberSchema = z.number().negative();
 * const toNegativeNumber = createSchemaParser(NegativeNumberSchema);
 * const alwaysANumber = toNegativeNumber("not_a_number", -1);
 * const sometimesNull = toNegativeNumber("not_a_number");
 */
export function createSchemaParser<T extends ZodType>(schema: T) {
  function parser(input: unknown, defaultValue: z.output<T>): z.output<T>;
  function parser(input: unknown, defaultValue?: undefined): z.output<T> | null;
  function parser(input: unknown, defaultValue?: z.output<T>): z.output<T> | null {
    return defaultValue !== undefined
      ? parseOrDefault(schema, input, defaultValue)
      : parseOrNull(schema, input);
  }

  return parser;
}

/**
 * Creates a schema parser with a validated default value and properly inferred return types.
 *
 * @example
 * const NegativeNumberSchema = z.number().negative();
 * const toNegativeNumber = asSchemaParser(NegativeNumberSchema);
 * const alwaysANumber = toNegativeNumber("not_a_number", -1);
 * const sometimesNull = toNegativeNumber("not_a_number");
 * // The below will throw at runtime because the default value is not a negative number.
 * const willThrowAtRuntime = toNegativeNumber("not_a_number", 100);
 */
export function asSchemaParser<Z extends ZodType, O extends z.output<Z>>(
  schema: Z,
  defaultValue: O
): (input: unknown) => O;
export function asSchemaParser<Z extends ZodType, O extends z.output<Z>>(
  schema: Z,
  defaultValue?: undefined
): (input: unknown) => O | null;
export function asSchemaParser<Z extends ZodType, O extends z.output<Z>>(
  schema: Z,
  defaultValue?: O
) {
  if (defaultValue !== undefined) {
    const result = schema.safeParse(defaultValue);
    if (!result.success) {
      throw new Error(`Invalid default value: ${JSON.stringify(defaultValue)}`);
    }
  }

  return (input: unknown): z.output<Z> | null => {
    const result = schema.safeParse(input);
    return result.success ? result.data : (defaultValue ?? null);
  };
}
