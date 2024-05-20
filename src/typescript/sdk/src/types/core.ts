import { type EventGuid, type AccountAddress, type Uint64 } from "@aptos-labs/ts-sdk";

export type SequenceInfo = {
  nonce: Uint64;
  last_bump_time: Uint64;
};

export type ExtendRef = {
  self: AccountAddress;
};

// JSON representation of the Event data from a UserTransactionResponse.
export type EventJSON = {
  guid: EventGuid;
  sequence_number: string;
  type: string;
  data: any;
};

export type AggregatorSnapshot<T> = {
  value: T;
};
