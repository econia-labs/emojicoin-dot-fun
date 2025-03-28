import {
  Account,
  Ed25519PrivateKey,
  Network,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";

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
  const formatted = PrivateKey.formatPrivateKey(privateKeyString, PrivateKeyVariants.Ed25519);
  const privateKey = new Ed25519PrivateKey(formatted);
  return Account.fromPrivateKey({ privateKey });
};
