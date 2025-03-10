import { z } from "zod";
import { createSchemaParser } from "./parse-or";
import { BigIntSchema } from "./bigint";
import { IntegerSchema } from "./integer";

const PositiveIntegerSchema = z
  .union([IntegerSchema, BigIntSchema])
  .pipe(z.coerce.number().positive());

export const toPositiveInteger = createSchemaParser(PositiveIntegerSchema);
