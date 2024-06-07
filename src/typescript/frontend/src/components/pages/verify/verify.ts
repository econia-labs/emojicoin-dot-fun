"use server";
// cspell:word Secp

import {
  Ed25519Signature,
  Secp256k1Signature,
  Ed25519PublicKey,
  Secp256k1PublicKey,
  AuthenticationKey,
  AccountAddress,
  AnyPublicKey,
  SigningScheme,
} from "@aptos-labs/ts-sdk";
import { getFullMessage, signingSchemeToString } from "./session-info";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { createSession } from "./session";
import { isAllowListed } from "lib/utils/allowlist";

const verifyEd25519 = (args: {
  pubkey: string;
  signature: string;
  address: AccountAddressString;
}) => {
  const { pubkey, address } = args;
  const ed25519PubKey = new Ed25519PublicKey(pubkey);
  const derivedAddress = ed25519PubKey.authKey().derivedAddress().toString();
  const message = getFullMessage(derivedAddress);
  const signature = new Ed25519Signature(args.signature);

  const verified =
    ed25519PubKey.verifySignature({
      message,
      signature,
    }) && address === derivedAddress;

  return {
    verified,
    pubkey: ed25519PubKey.toString(),
    address: derivedAddress,
    message,
    scheme: SigningScheme.Ed25519,
    signature: signature.toString(),
  };
};

const verifySecp256k1 = (args: {
  pubkey: string;
  signature: string;
  address: AccountAddressString;
}) => {
  const { pubkey, address } = args;
  const scp256k1PubKey = new Secp256k1PublicKey(pubkey);
  const authKey = AuthenticationKey.fromPublicKey({
    publicKey: new AnyPublicKey(scp256k1PubKey),
  });
  const derivedAddress = authKey.derivedAddress().toString();
  const message = getFullMessage(derivedAddress);
  const signature = new Secp256k1Signature(args.signature);
  const verified =
    scp256k1PubKey.verifySignature({
      message,
      signature,
    }) && address === derivedAddress;

  return {
    verified,
    pubkey: scp256k1PubKey.toString(), // Normalized.
    address: derivedAddress, // Normalized.
    message,
    scheme: SigningScheme.SingleKey,
    signature: signature.toString(),
  };
};

export async function verifySignatureAndCreateSession(args: {
  pubkey: string | string[];
  signature: string;
  address: AccountAddressString;
}) {
  const { pubkey, signature, address } = args;

  // Don't need to support multi-pubkey accounts for this.
  if (Array.isArray(pubkey)) {
    return false;
  }

  // Verify the signature as either Ed25519 and Secp256k1.
  const inputAddress = AccountAddress.from(address).toString();
  let info: ReturnType<typeof verifyEd25519> | undefined;
  try {
    // NOTE: Don't think this will work with the `SingleKey` scheme. But we can fix it if we need to.
    info = verifyEd25519({
      pubkey,
      signature,
      address: inputAddress,
    });
  } catch (e) {
    console.error(e);
  }
  if (!info) {
    try {
      info = verifySecp256k1({
        pubkey,
        signature,
        address: inputAddress,
      });
    } catch (e) {
      // no-op.
    }
  }

  if (!info || !info.verified) {
    return false;
  }

  createSession({
    pubkey: info.pubkey,
    signature: info.signature,
    scheme: info.scheme,
    address: info.address,
  });
  return true;
}

// This is probably a bad way to do this, since we should be storing their authentication
// session cookie in a database or something, that way our middleware isn't complex/computationally
// expensive. Alas, I am but a man (and this is temporary and a proof of concept).
export const authenticate = async (args: {
  pubkey: string;
  signature: string;
  scheme: string;
  address: string;
}) => {
  const { pubkey, signature, scheme, address } = args;
  let info: ReturnType<typeof verifyEd25519> | undefined;

  switch (scheme) {
    case signingSchemeToString(SigningScheme.Ed25519):
      info = verifyEd25519({
        pubkey,
        signature,
        address,
      });
      break;
    case signingSchemeToString(SigningScheme.SingleKey):
      info = verifySecp256k1({
        pubkey,
        signature,
        address,
      });
      break;
    default:
      return false;
  }

  if (!info || !info.verified) {
    return false;
  }
  return await isAllowListed(info.address);
};
