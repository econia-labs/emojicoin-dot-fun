/* eslint-disable import/no-unused-modules */
import {
  type AccountAddress,
  type AccountAddressInput,
  type AccountAuthenticator,
  type TypeTag,
} from "@aptos-labs/ts-sdk";

export type Option<T> = {
  vec: [T] | [];
};

// Because the @aptos-labs/ts-sdk does not let you use a `number` for `Uint64`,
// we coalesce the types here.
export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint64 = number | bigint;
export type Uint128 = number | bigint;
export type Uint256 = number | bigint;
export type AnyNumber = number | bigint;

export type InputTypes =
  | boolean
  | Uint8
  | Uint16
  | Uint32
  | Uint64
  | Uint128
  | Uint256
  | AccountAddressInput
  | string
  | ObjectAddress
  | Array<InputTypes>;
export type TypeTagInput = string | TypeTag;

export type ObjectAddress = AccountAddressInput;
export type MoveObject = AccountAddress;

// For clarity in JSON view function return response types.
export type Uint64String = string;
export type Uint128String = string;
export type Uint256String = string;
export type AccountAddressString = `0x${string}`;
export type ObjectAddressStruct = {
  inner: string;
};
export type HexString = string;

// This is supposed to match some function in the wallet adapter. Not tested yet.
export type WalletSignTransactionFunction = (...args: any[]) => Promise<AccountAuthenticator>;

export type AccountAuthenticatorWithData = {
  accountAddress: AccountAddress;
  accountAuthenticator: AccountAuthenticator;
};
