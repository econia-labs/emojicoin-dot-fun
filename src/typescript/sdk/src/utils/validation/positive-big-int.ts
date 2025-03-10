import { z } from "zod";
import { createSchemaParser } from "./parse-or";
import { BigIntSchema } from "./bigint";

// Composably build upon the existing bigint schema validation, ensuring the output is positive.
const PositiveBigIntSchema = BigIntSchema.pipe(z.coerce.bigint().positive());

export const toPositiveBigInt = createSchemaParser(PositiveBigIntSchema);
