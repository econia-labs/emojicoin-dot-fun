import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { compareBigInt } from "../../src/utils/compare-bigint";

export const getTxnBatchHighestVersion = (responses: Array<UserTransactionResponse>) => {
  const response = responses.sort((a, b) => compareBigInt(a.version, b.version)).at(-1);
  if (!response) throw new Error("No responses found in array.");
  return BigInt(response.version);
};
