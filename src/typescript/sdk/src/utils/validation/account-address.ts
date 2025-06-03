import { AccountAddress } from "@aptos-labs/ts-sdk";
import { z } from "zod";

export const AccountAddressSchema = z
  .string()
  .refine((arg) => arg && AccountAddress.isValid({ input: arg }).valid, {
    message: "Invalid account address format",
  })
  .transform((v) => AccountAddress.from(v).toString());
