import { Account, Ed25519PrivateKey, Hex, Network } from "@aptos-labs/ts-sdk";

import { APTOS_NETWORK } from "@/sdk/const";

/**
 * Expose the local publisher account for local development.
 */
export const getLocalPublisher = () => {
  if (APTOS_NETWORK !== Network.LOCAL) {
    throw new Error("You can't call this function in a non-local network environment.");
  }
  const privateKeyString = process.env.PUBLISHER_PRIVATE_KEY;
  if (!privateKeyString) throw new Error("Publisher private key not set.");
  const privateKey = new Ed25519PrivateKey(Hex.fromHexString(privateKeyString).toUint8Array());
  return Account.fromPrivateKey({ privateKey });
};
