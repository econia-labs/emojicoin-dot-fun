import { z } from "zod";

export type ValidAptosName = string & {
  __brand: "ValidAptosName";
};

/**
 * Schema validation largely borrowed from the ANS name validation logic in the Aptos TS SDK.
 *
 * Unfortunately it is not exported to the TS SDK, but the logic is fairly straightforward.
 *
 * @see {@link https://github.com/aptos-labs/aptos-ts-sdk/blob/db88e984528a545a240bad876d9ea832fd0c8348/src/internal/ans.ts#L55}
 */

export const VALIDATION_RULES_DESCRIPTION = [
  "A name must be between 3 and 63 characters long,",
  "and can only contain lowercase a-z, 0-9, and hyphens.",
  "A name may not start or end with a hyphen.",
].join(" ");

const AnsSegmentSchema = z
  .string()
  .min(3, { message: "Name must be at least 3 characters long" })
  .max(63, { message: "Name cannot exceed 63 characters" })
  .regex(/^[a-z\d][a-z\d-]{1,61}[a-z\d]$/, {
    message: VALIDATION_RULES_DESCRIPTION,
  });

const AnsNameSchema = z
  .string()
  .transform((s) => s.replace(/\.apt$/, ""))
  .refine((nameWithoutSuffix) => {
    const parts = nameWithoutSuffix.split(".");
    return parts.length <= 2 && parts.every((p) => AnsSegmentSchema.safeParse(p).success);
  });

export const isValidAptosName = (name: unknown): name is ValidAptosName =>
  AnsNameSchema.safeParse(name).success;
