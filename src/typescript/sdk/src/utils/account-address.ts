import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";

export const normalizeAddress = (address: AccountAddressInput) =>
  AccountAddress.from(address).toString();
