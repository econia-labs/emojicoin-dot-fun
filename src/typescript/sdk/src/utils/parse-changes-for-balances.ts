import {
  AccountAddress,
  type TypeTag,
  type AccountAddressInput,
  type WriteSetChangeWriteResource,
  parseTypeTag,
  type UserTransactionResponse,
  isFeePayerSignature,
} from "@aptos-labs/ts-sdk";
import { APTOS_COIN_TYPE_TAG } from "../const";
import { type JSONFeeStatement, toFeeStatement } from "../types/core";
import { type TypeTagInput } from "../emojicoin_dot_fun/types";

export const getFeeStatement = (response: UserTransactionResponse) => {
  const jsonFeeStatement = response.events.find(
    (event) => event.type === "0x1::transaction_fee::FeeStatement"
  )?.data as JSONFeeStatement;
  return toFeeStatement(jsonFeeStatement);
};

/* eslint-disable-next-line import/no-unused-modules */
export const toCoinStore = (type: TypeTagInput) =>
  parseTypeTag(`0x1::coin::CoinStore<${type.toString()}>`);

/**
 * Note that as of right now, not all APT coin balance changes aren't included in the change sets,
 * because storage fee refunds are not included in the change sets. We must check the events for
 * the FeeStatement event and then add the storage fee refund to the net balance after
 * calculating the balance from the change sets.
 */
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
  const { signature } = response;

  // We need to check for and account for storage fee refunds if the user is the fee payer and the
  // coin type is APT.
  let feePayerAddress: AccountAddress | undefined;
  if (signature && isFeePayerSignature(signature)) {
    feePayerAddress = AccountAddress.from(signature.fee_payer_address);
  }
  const feeStatement = getFeeStatement(response);
  const senderIsFeePayer = feePayerAddress === AccountAddress.from(userAddress);
  const isAptosCoin = coinType.toString() === APTOS_COIN_TYPE_TAG.toString();
  const storageRefund = senderIsFeePayer && isAptosCoin ? feeStatement.storageFeeRefundOctas : 0n;

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

  // Note that we only account for the storage refund if the user's coin balance is in the change
  // set; otherwise, we can't be sure what exactly the balance is, only that they got a refund.
  if (coinBalanceChange) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return BigInt((coinBalanceChange.data.data as any).coin.value) + storageRefund;
  }

  // Thus, we return undefined, even if we know that the user got a refund.
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
