"use server";

import { isInGalxeCampaign, isOnCustomAllowlist } from "lib/utils/allowlist";

export async function getVerificationStatus(address: `0x${string}`) {
  const [galxe, customAllowlisted] = await Promise.all([
    isInGalxeCampaign(address),
    isOnCustomAllowlist(address),
  ]);
  return {
    galxe,
    customAllowlisted,
  };
}
