import { z } from "zod";
import { createSchemaParser } from "./create-schema-parser";
import { BigIntSchema } from "./bigint";

/**
 * @see {@link BigIntSchema}
 */
export const PositiveBigIntSchema = BigIntSchema.pipe(z.coerce.bigint().positive());
export const toPositiveBigInt = createSchemaParser(PositiveBigIntSchema);
export const isPositiveBigInt = (n: unknown) => toPositiveBigInt(n) !== null;
