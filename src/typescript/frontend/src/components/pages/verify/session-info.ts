// cspell:word emojicoindotfun

import { SigningScheme, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { UNIT_OF_TIME_MULTIPLIERS, UnitOfTime, getTime } from "@sdk/utils/misc";

export const messageToSign =
  "Sign this message to verify that you are the owner of this account. ✅";
export const getTimeByWeekFloored = () =>
  Math.floor(getTime(UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Weeks])).toString();
export const getFullMessage = (address: AccountAddressInput) =>
  `APTOS\naddress: ${address}\nmessage: ${messageToSign}\nnonce: ${getTimeByWeekFloored()}`;

export const signingSchemeToString = (scheme: SigningScheme) => {
  switch (scheme) {
    case SigningScheme.Ed25519:
      return "Ed25519";
    case SigningScheme.SingleKey:
      return "SingleKey";
    default:
      return "not supported";
  }
};

export const COOKIE_FOR_PUBKEY = "emojicoindotfun-pubkey";
export const COOKIE_FOR_SIGNATURE = "emojicoindotfun-signature";
export const COOKIE_FOR_ACCOUNT_SCHEME = "emojicoindotfun-account-scheme";
export const COOKIE_FOR_ACCOUNT_ADDRESS = "emojicoindotfun-account-address";
export const COOKIE_LENGTH = UNIT_OF_TIME_MULTIPLIERS[UnitOfTime.Weeks] * 1;

// For reference, the signMessage function that's used:
/*
  export interface SignMessagePayload {
    address?: boolean; // Should we include the address of the account in the message
    application?: boolean; // Should we include the domain of the dapp
    chainId?: boolean; // Should we include the current chain id the wallet is connected to
    message: string; // The message to be signed and displayed to the user
    nonce: string; // A nonce the dapp should generate
  }

  export interface SignMessageResponse {
    address?: string;
    application?: string;
    chainId?: number;
    fullMessage: string; // The message that was generated to sign
    message: string; // The message passed in by the user
    nonce: string;
    prefix: "APTOS"; // Should always be APTOS
    signature: string | string[] | Signature; // The signed full message
    bitmap?: Uint8Array; // a 4-byte (32 bits) bit-vector of length N
  }
*/
