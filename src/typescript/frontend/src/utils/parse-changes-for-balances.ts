import {
  AccountAddress,
  type TypeTag,
  type AccountAddressInput,
  type WriteSetChange,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

export const getNewCoinBalanceFromChanges = ({
  changes,
  userAddress,
  coinType,
}: {
  changes: WriteSetChange[];
  userAddress: AccountAddressInput;
  coinType: TypeTag;
}) => {
  const coinBalanceChange = changes.find((change) => {
    const changeType = change.type;
    if (changeType !== "write_resource") return false;

    const address = (change as WriteSetChangeWriteResource).address;
    if (!AccountAddress.from(userAddress).equals(AccountAddress.from(address))) return false;

    const resourceType = (change as WriteSetChangeWriteResource).data.type;
    if (resourceType !== `0x1::coin::CoinStore<${coinType.toString()}>`) return false;

    const changeData = (change as WriteSetChangeWriteResource).data.data as any;
    return typeof changeData.coin.value === "string";
  }) as WriteSetChangeWriteResource | undefined;

  if (coinBalanceChange) {
    return BigInt((coinBalanceChange.data.data as any).coin.value);
  }

  return 0n;
};
