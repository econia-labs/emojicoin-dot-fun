"use server";
import { isOnCustomAllowlist } from "lib/utils/allowlist";

export async function getIsOnCustomAllowlist(address: `0x${string}`) {
  return await isOnCustomAllowlist(address);
}
