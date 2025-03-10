import { z } from "zod";
import { createSchemaParser } from "./create-schema-parser";
import { IntegerSchema } from "./integer";

/**
 * @see {@link IntegerSchema}
 */
const PositiveIntegerSchema = IntegerSchema.pipe(z.coerce.number().positive());
export const toPositiveInteger = createSchemaParser(PositiveIntegerSchema);
export const isPositiveInteger = (n: unknown) => toPositiveInteger(n) !== null;
