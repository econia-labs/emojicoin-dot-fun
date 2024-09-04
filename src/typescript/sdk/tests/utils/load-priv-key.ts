/* eslint-disable no-console */
import { Account, AccountAddress, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { VERCEL } from "../../src/const";

export const getTestPublisherPrivateKey = async () => {
  if (VERCEL) {
    throw new Error("This function should not be called in a Vercel deployment.");
  }
  // If the publisher private key is not set by now, throw an error.
  if (!process.env.PUBLISHER_PRIVATE_KEY) {
    console.warn(
      "Missing PUBLISHER_PRIVATE_KEY environment variable for test, using the default value.");
    process.env.PUBLISHER_PRIVATE_KEY =
      "29479e9e5fe47ba9a8af509dd6da1f907510bcf8917bfb19b7079d8c63c0b720";
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
