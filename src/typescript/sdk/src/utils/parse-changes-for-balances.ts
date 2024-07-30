import {
  AccountAddress,
  type TypeTag,
  type AccountAddressInput,
  type WriteSetChangeWriteResource,
  parseTypeTag,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { APTOS_COIN_TYPE_TAG } from "../const";
import { type JSONFeeStatement, toFeeStatement } from "../types/core";
import { type TypeTagInput } from "../emojicoin_dot_fun/types";

/* eslint-disable-next-line import/no-unused-modules */
export const getFeeStatement = (response: UserTransactionResponse) => {
  const jsonFeeStatement = response.events.find(
    (event) => event.type === "0x1::transaction_fee::FeeStatement"
  )?.data as JSONFeeStatement;
  return toFeeStatement(jsonFeeStatement);
};

/* eslint-disable-next-line import/no-unused-modules */
export const toCoinStore = (type: TypeTagInput) =>
  parseTypeTag(`0x1::coin::CoinStore<${type.toString()}>`);

export const getCoinBalanceFromChanges = ({
  response,
  userAddress,
  coinType,
}: {
  response: UserTransactionResponse;
  userAddress: AccountAddressInput;
  coinType: TypeTag;
}) => {
  const { changes } = response;
  const coinBalanceChange = changes.find((change) => {
    const changeType = change.type;
    if (changeType !== "write_resource") return false;

    const { address } = change as WriteSetChangeWriteResource;
    if (!AccountAddress.from(userAddress).equals(AccountAddress.from(address))) return false;

    const resourceType = (change as WriteSetChangeWriteResource).data.type;
    // Normalize the coin type, otherwise leading zeros can cause the comparison to fail.
    const changeCoinType = parseTypeTag(resourceType).toString();
    if (changeCoinType !== toCoinStore(coinType).toString()) return false;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const changeData = (change as WriteSetChangeWriteResource).data.data as any;
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
    coinType: APTOS_COIN_TYPE_TAG,
  });
