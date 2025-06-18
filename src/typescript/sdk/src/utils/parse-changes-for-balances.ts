import type {
  AccountAddressInput,
  TypeTag,
  UserTransactionResponse,
  WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { AccountAddress, pairedFaMetadataAddress, parseTypeTag } from "@aptos-labs/ts-sdk";

import type { JsonTypes } from "..";
import { APTOS_COIN_TYPE_STRING } from "../const";
import type { TypeTagInput } from "../emojicoin_dot_fun/types";
import { toCoinStore, toFungibleStore } from "../types/coin-and-fungible-assets-types";
import type { JSONFeeStatement } from "../types/core";
import { isWriteSetChangeWriteResource, toFeeStatement } from "../types/core";
import { getPrimaryFungibleStoreAddress } from "./aptos-utils";
import { findMap } from "./misc";
import {
  COIN_STORE_TYPE_TAG_STRUCT,
  type CoinStoreString,
  type CoinTypeString,
  ensureTypeTagStruct,
  FUNGIBLE_STORE_TYPE_TAG_STRUCT,
  getOuterTypeFromTypeTag,
} from "./type-tags";

/* eslint-disable-next-line import/no-unused-modules */
export const getFeeStatement = (response: UserTransactionResponse) => {
  const jsonFeeStatement = response.events.find(
    (event) => event.type === "0x1::transaction_fee::FeeStatement"
  )?.data as JSONFeeStatement;
  return toFeeStatement(jsonFeeStatement);
};

export const toCoinTypeString = (type: TypeTagInput) =>
  parseTypeTag(type.toString()).toString() as CoinTypeString;

export const toCoinStoreString = (type: TypeTagInput) =>
  `0x1::coin::CoinStore<${toCoinTypeString(type)}>` as CoinStoreString;

const isACoinStoreWriteResource = (
  change: WriteSetChangeWriteResource
): change is JsonTypes["CoinStoreWriteSetChange"] => {
  const resourceType = parseTypeTag(change.data.type);
  return (
    resourceType.isStruct() &&
    getOuterTypeFromTypeTag(resourceType) === COIN_STORE_TYPE_TAG_STRUCT.toString()
  );
};

const isAPrimaryStoreWriteResource = (
  change: WriteSetChangeWriteResource
): change is JsonTypes["FungibleStoreWriteSetChange"] => {
  const resourceType = parseTypeTag(change.data.type).toString();
  return resourceType !== FUNGIBLE_STORE_TYPE_TAG_STRUCT.toString();
};

const maybeGetUserCoinStore = ({
  change,
  userAddress,
  coinType,
}: {
  change: WriteSetChangeWriteResource;
  userAddress: AccountAddressInput;
  coinType: CoinTypeString | TypeTag;
}) => {
  const { address } = change;
  if (!AccountAddress.from(userAddress).equals(AccountAddress.from(address))) return undefined;

  // Ensure the coin type matches and normalize the type tags, otherwise leading zeros can cause a
  // false negative comparison result.
  const resourceType = change.data.type;
  const changeCoinType = parseTypeTag(resourceType).toString();
  const matchesCoinType = changeCoinType === toCoinStoreString(coinType);

  if (!matchesCoinType) return undefined;
  if (!isACoinStoreWriteResource(change)) return undefined;

  return toCoinStore(change.data.data);
};

// To find a user's primary store, two conditions need to be true:
// 1. The top-level `address` in the write resource change needs to match the primary fungible store.
// 2. The inner metadata address needs to match the expected fungible asset's metadata.
const maybeGetMatchingPrimaryStore = ({
  change,
  metadataAddress,
  primaryStoreAddress,
}: {
  change: WriteSetChangeWriteResource;
  metadataAddress: AccountAddress;
  primaryStoreAddress: AccountAddress;
}) => {
  const changeAddress = AccountAddress.from(change.address);
  if (!changeAddress.equals(primaryStoreAddress)) return undefined;
  if (!isAPrimaryStoreWriteResource(change)) return undefined;

  const primaryStore = toFungibleStore(change.data.data);
  if (!primaryStore.metadata.inner.equals(metadataAddress)) return undefined;

  return primaryStore;
};

export const getBalanceFromWriteSetChanges = ({
  response,
  userAddress,
  coinType,
}: {
  response: UserTransactionResponse;
  userAddress: AccountAddressInput;
  coinType: CoinTypeString | TypeTag;
}) => {
  const { changes } = response;
  const writeResources = changes.filter(isWriteSetChangeWriteResource);
  const coinTypeStruct = ensureTypeTagStruct(coinType).toString();
  const metadataAddress = pairedFaMetadataAddress(coinTypeStruct);
  const primaryStoreAddress = getPrimaryFungibleStoreAddress({
    ownerAddress: userAddress,
    metadataAddress,
  });

  // Try to find the primary store.
  const primaryStore = findMap(writeResources, (change) =>
    maybeGetMatchingPrimaryStore({ change, metadataAddress, primaryStoreAddress })
  );
  if (primaryStore) return primaryStore.balance;

  // Try again, but look for the coin store instead.
  const coinStore = findMap(writeResources, (change) =>
    maybeGetUserCoinStore({ change, userAddress, coinType })
  );

  return coinStore?.coin.value;
};

export const parseWriteSetForAPTBalance = (
  response: UserTransactionResponse,
  userAddress: AccountAddressInput
) =>
  getBalanceFromWriteSetChanges({
    response,
    userAddress,
    coinType: APTOS_COIN_TYPE_STRING,
  });
