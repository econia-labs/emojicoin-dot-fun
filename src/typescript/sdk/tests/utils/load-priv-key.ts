/* eslint-disable no-console */
import { Account, AccountAddress, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { VERCEL } from "../../src/const";

export const getTestPublisherPrivateKey = () => {
  if (VERCEL) {
    throw new Error("This function should not be called in a Vercel deployment.");
  }
  // If the publisher private key is not set by now, throw an error.
  if (!process.env.PUBLISHER_PRIVATE_KEY) {
    throw new Error("PUBLISHER_PRIVATE_KEY is not set.");
  }

  const derivedAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.PUBLISHER_PRIVATE_KEY),
  });
  const derivedAddress = derivedAccount.accountAddress.toString();
  const normalizedEnvAddress = AccountAddress.from(process.env.NEXT_PUBLIC_MODULE_ADDRESS!);

  if (derivedAddress !== normalizedEnvAddress.toString()) {
    const msg = `${derivedAddress} !== ${process.env.NEXT_PUBLIC_MODULE_ADDRESS}`;
    throw new Error(`PUBLISHER_PRIVATE_KEY does not match NEXT_PUBLIC_MODULE_ADDRESS: ${msg}`);
  }

  return process.env.PUBLISHER_PRIVATE_KEY;
};
