import { type Ed25519Account, type Aptos } from "@aptos-labs/ts-sdk";

export interface Result {
  transaction_hash: string;
  gas_used: number;
  gas_unit_price: number;
  sender: string;
  sequence_number: number;
  success: boolean;
  timestamp_us: number;
  version: number;
  vm_status: string;
}

export interface ResultJSON {
  Result: Result;
}

export type PublishPackageResult = {
  transaction_hash: string;
  gas_used: number;
  gas_unit_price: number;
  sender: string;
  sequence_number: number;
  success: boolean;
  timestamp_us: number; // Microseconds.
  version: number;
  vm_status: string;
};

export type TestHelpers = {
  aptos: Aptos;
  publisher: Ed25519Account;
  publishPackageResult: PublishPackageResult;
};
