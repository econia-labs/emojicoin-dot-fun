import { AccountAddress } from "@aptos-labs/ts-sdk";
import { z } from "zod";

export const AccountAddressSchema = z
  .string()
  .refine((arg) => AccountAddress.isValid({ input: arg }).valid, {
    message: "Invalid account address format",
  })
  .transform((val) => AccountAddress.from(val));
