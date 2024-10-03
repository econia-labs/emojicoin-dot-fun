"use server";
import { sha3_256 } from "@noble/hashes/sha3";
import { normalizeHex } from "@sdk/utils";

export const hashAddress = async (address: string) => {
  // Ensure the HASH_SEED is valid, since we don't import it.
  if (!process.env.HASH_SEED || process.env.HASH_SEED.length < 8) {
    throw new Error("Environment variable HASH_SEED must be set and at least 8 characters.");
  }
  const HASH_SEED = process.env.HASH_SEED;
  // Use `process.env.HASH_SEED` here to avoid polluting the namespace with @aptos-labs/ts-sdk`
  // imports that import functions that aren't supported in the Edge Runtime middleware.
  const buffer = Buffer.from(`${address}::${HASH_SEED}`, "utf-8");
  const hash = sha3_256(new Uint8Array(buffer));
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
