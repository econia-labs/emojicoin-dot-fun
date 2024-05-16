import { type EventGuid, type AccountAddress, type Uint64 } from "@aptos-labs/ts-sdk";

export type SequenceInfo = {
  nonce: Uint64;
  last_bump_time: Uint64;
};

export type ExtendRef = {
  self: AccountAddress;
};

// JSON representation of the Event data from a UserTransactionResponse.
// We allow `guid` and `sequence_number` to be optional because we don't
// need them and in some cases we don't pass them in since our data can
// come from the database directly as event JSON data.
// The fields have essentially been deprecated since event v2 because
// they've been zeroed out in the Aptos VM in order to parallelize event
// emission.
export type EventJSON = {
  guid?: EventGuid;
  sequence_number?: string;
  type: string;
  data: any;
};

export type AggregatorSnapshot<T> = {
  value: T;
};
