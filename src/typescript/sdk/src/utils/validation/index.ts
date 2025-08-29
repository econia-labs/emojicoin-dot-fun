import { AccountAddressSchema } from "./account-address";
import { BigIntSchema, PositiveBigIntSchema } from "./bigint";
import { IntegerSchema, NonNegativeIntegerSchema, PositiveIntegerSchema } from "./integer";
import { SymbolEmojisSchema } from "./symbol-emoji";

export const Schemas = {
  Integer: IntegerSchema,
  BigInt: BigIntSchema,
  PositiveInteger: PositiveIntegerSchema,
  NonNegativeInteger: NonNegativeIntegerSchema,
  PositiveBigInt: PositiveBigIntSchema,
  AccountAddress: AccountAddressSchema,
  SymbolEmojis: SymbolEmojisSchema,
};

export * from "./ans-name";
