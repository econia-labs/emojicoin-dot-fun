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

/**
 * A function that unwraps the value inside an AggregatorSnapshot JSON type `T1` and converts it to
 * a value of type `T2` using the provided conversion function.
 *
 * You must pass in a function that can convert the data field of the
 * `AggregatorSnapshot<T1>` to a value of type `T2`.
 *
 * @param data
 * @param fn
 * @returns a `value: T2`
 * @see AggregatorSnapshot
 */
export const fromAggregatorSnapshot: <T1, T2>(
  data: AggregatorSnapshot<T1>,
  fn: (d: any) => T2
) => T2 = (data, fn) => fn(data.value);

export type GUID = {
  creation_number: bigint;
  account_address: AccountAddressString;
};
