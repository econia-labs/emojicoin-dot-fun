import type {
  AccountAddressInput,
  TypeTag,
  UserTransactionResponse,
  WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { AccountAddress, parseTypeTag } from "@aptos-labs/ts-sdk";

import { APTOS_COIN_TYPE_STRING } from "../const";
import type { TypeTagInput } from "../emojicoin_dot_fun/types";
import type { JSONFeeStatement } from "../types/core";
import { isWriteSetChangeWriteResource, toFeeStatement } from "../types/core";
import type { CoinStoreString, CoinTypeString } from "./type-tags";

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

export const getCoinBalanceFromChanges = ({
  response,
  userAddress,
  coinType,
}: {
  response: UserTransactionResponse;
  userAddress: AccountAddressInput;
  coinType: CoinTypeString | TypeTag;
}) => {
  const { changes } = response;
  const coinBalanceChange = changes.find((change) => {
    if (!isWriteSetChangeWriteResource(change)) return false;

    const { address } = change;
    if (!AccountAddress.from(userAddress).equals(AccountAddress.from(address))) return false;

    const resourceType = change.data.type;
    // Normalize the coin type, otherwise leading zeros can cause the comparison to fail.
    const changeCoinType = parseTypeTag(resourceType).toString();
    if (changeCoinType !== toCoinStoreString(coinType)) return false;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const changeData = change.data.data as any;
    return typeof changeData.coin.value === "string";
  }) as WriteSetChangeWriteResource | undefined;

  if (coinBalanceChange) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return BigInt((coinBalanceChange.data.data as any).coin.value);
  }

  return undefined;
};

export const getAptBalanceFromChanges = (
  response: UserTransactionResponse,
  userAddress: AccountAddressInput
) =>
  getCoinBalanceFromChanges({
    response,
    userAddress,
    coinType: APTOS_COIN_TYPE_STRING,
  });
