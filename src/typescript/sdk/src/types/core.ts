import {
  type EntryFunctionPayloadResponse,
  type EventGuid,
  isUserTransactionResponse,
  type TransactionResponse,
  type UserTransactionResponse,
  type WriteSetChange,
  type WriteSetChangeWriteResource,
  type WriteSetChangeWriteTableItem,
} from "@aptos-labs/ts-sdk";

import type { AccountAddressString } from "../emojicoin_dot_fun/types";
import type { Flatten } from ".";

// JSON representation of the Event data from a UserTransactionResponse.
// We allow `guid` and `sequence_number` to be optional because we don't
// need them and in some cases we don't pass them in since our data can
// come from the database directly as event JSON data.
// The fields have essentially been deprecated since event v2 because
// they've been zeroed out in the Aptos VM in order to parallelize event
// emission.
// Note that the `guid` here is NOT the same as the `guid` in the module event types in
// `types.ts`. The `guid` here is a deprecated Move resource emitted in the v1 event data,
// where as the `guid` in our module event types is a unique identifier for the event type
// we use to avoid storing duplicate events in state.
export type EventJSON = {
  guid?: EventGuid;
  sequence_number?: string;
  type: string;
  data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
};

export type AggregatorSnapshot<T> = {
  max_value?: string; // This field is included in view function responses but not in txn JSON data.
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
  fn: (d: any) => T2 /* eslint-disable-line @typescript-eslint/no-explicit-any */
) => T2 = (data, fn) => fn(data.value);

export type GUID = {
  creation_number: bigint;
  account_address: AccountAddressString;
};

export type JSONFeeStatement = {
  total_charge_gas_units: string;
  execution_gas_units: string;
  io_gas_units: string;
  storage_fee_octas: string;
  storage_fee_refund_octas: string;
};

export type FeeStatement = {
  totalChargeGasUnits: bigint;
  executionGasUnits: bigint;
  ioGasUnits: bigint;
  storageFeeOctas: bigint;
  storageFeeRefundOctas: bigint;
};

export const toFeeStatement = (json: JSONFeeStatement): FeeStatement => ({
  totalChargeGasUnits: BigInt(json.total_charge_gas_units),
  executionGasUnits: BigInt(json.execution_gas_units),
  ioGasUnits: BigInt(json.io_gas_units),
  storageFeeOctas: BigInt(json.storage_fee_octas),
  storageFeeRefundOctas: BigInt(json.storage_fee_refund_octas),
});

export const isWriteSetChangeWriteResource = (
  writeSet: WriteSetChange
): writeSet is WriteSetChangeWriteResource => writeSet.type === "write_resource";

export const isWriteSetChangeWriteTableItem = (
  writeSet: WriteSetChange
): writeSet is WriteSetChangeWriteTableItem => writeSet.type === "write_table_item";

type UserTransactionResponseWithEntryFunctionPayload = Flatten<
  UserTransactionResponse & {
    payload: EntryFunctionPayloadResponse;
  }
>;

export const isEntryFunctionUserTransactionResponse = (
  response: TransactionResponse
): response is UserTransactionResponseWithEntryFunctionPayload => {
  return isUserTransactionResponse(response) && response.payload.type === "entry_function_payload";
};
