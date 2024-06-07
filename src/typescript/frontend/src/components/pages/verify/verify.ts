"use server";
import { sha3_256 } from "@noble/hashes/sha3";
import { normalizeHex } from "@sdk/utils";
import { HASH_SEED } from "lib/server-env";

export const hashAddress = async (address: string) => {
  const buffer = Buffer.from(`${address}::${HASH_SEED}`, "utf-8");
  const hash = sha3_256(buffer);
  return normalizeHex(hash);
};

// Check their hashed cookie against the address to see if they've been authenticated already.
export const authenticate = async ({ address, hashed }: { address: string; hashed: string }) => {
  const clientSideHash = hashed;
  const serverSideComputedHash = await hashAddress(address);

  // Since security isn't a huge issue here, we just let the user in without checking if they're
  // allowlisted as long as they have the correct hashed address.
  // We only check if they're allowlisted when we set the initial cookie.
  if (clientSideHash !== serverSideComputedHash) {
    return false;
  }

  return true;
};
