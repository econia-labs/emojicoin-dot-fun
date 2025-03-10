import { BigIntSchema } from "./bigint";
import { IntegerSchema } from "./integer";
import { PositiveBigIntSchema } from "./positive-big-int";
import { PositiveIntegerSchema } from "./positive-integer";

export * from "./bigint";
export * from "./create-schema-parser";
export * from "./integer";
export * from "./positive-big-int";
export * from "./positive-integer";
export const Schemas = {
  Integer: IntegerSchema,
  BigInt: BigIntSchema,
  PositiveInteger: PositiveIntegerSchema,
  PositiveBigInt: PositiveBigIntSchema,
};
