import { type AccountAddress, type Uint64 } from "@aptos-labs/ts-sdk";

export type SequenceInfo = {
  nonce: Uint64;
  last_bump_time: Uint64;
};

export type ExtendRef = {
  self: AccountAddress;
};
