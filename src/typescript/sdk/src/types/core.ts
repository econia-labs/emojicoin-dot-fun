import { type EventGuid } from "@aptos-labs/ts-sdk";
import { type AccountAddressString } from "../emojicoin_dot_fun/types";

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

export const toAggregatorSnapshot = (data: { value: string }) => BigInt(data.value);

export type GUID = {
  creation_number: bigint;
  account_address: AccountAddressString;
};
