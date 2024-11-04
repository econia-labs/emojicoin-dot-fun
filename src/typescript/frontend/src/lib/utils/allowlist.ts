import "server-only";

import { IS_ALLOWLIST_ENABLED } from "lib/env";
import { ALLOWLISTER3K_URL, GALXE_CAMPAIGN_ID } from "lib/server-env";

export const GALXE_URL = "https://graphigo.prd.galaxy.eco/query";

// Checks if the given address is allow listed either in Galxe or in Allowlister3000.
//
// If IS_ALLOWLIST_ENABLED is not truthy, the function returns true.
//
// The address can be provided either as "0xabc" or directly "abc".
export async function isAllowListed(addressIn: string): Promise<boolean> {
  if (!IS_ALLOWLIST_ENABLED) {
    return true;
  }

  const address = addressIn.startsWith("0x")
    ? (addressIn as `0x${string}`)
    : (`0x${addressIn}` as const);

  return (await isInGalxeCampaign(address)) || (await isOnCustomAllowlist(address));
}

export const isInGalxeCampaign = async (address: `0x${string}`): Promise<boolean> => {
  if (GALXE_CAMPAIGN_ID !== undefined) {
    const condition = await fetch(GALXE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `{
        campaign(id: "${GALXE_CAMPAIGN_ID}") {
          whitelistInfo(address: "${address}") {
            maxCount
            usedCount
            claimedLoyaltyPoints
            currentPeriodMaxLoyaltyPoints
            currentPeriodClaimedLoyaltyPoints
          }
        }
      }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => data.data.campaign && data.data.campaign.whitelistInfo.usedCount === 1);
    if (condition) {
      return true;
    }
  }

  return false;
};

export const isOnCustomAllowlist = async (address: `0x${string}`): Promise<boolean> => {
  if (ALLOWLISTER3K_URL !== undefined) {
    const condition = await fetch(`${ALLOWLISTER3K_URL}/${address}`)
      .then((r) => r.text())
      .then((data) => data === "true");
    if (condition) {
      return true;
    }
  }

  return false;
};
