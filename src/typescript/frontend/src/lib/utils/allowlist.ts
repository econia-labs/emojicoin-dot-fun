import "server-only";

import { IS_ALLOWLIST_ENABLED } from "lib/env";
import { ALLOWLISTER3K_URL } from "lib/server-env";

// Checks if the given address is allow listed in Allowlister3000.
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

  return await isOnCustomAllowlist(address);
}

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
