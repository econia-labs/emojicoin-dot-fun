import { type AnyNumberString, APTOS_NETWORK } from "@econia-labs/emojicoin-sdk";

const linkTypes = {
  coin: "coin",
  acc: "account",
  account: "account",
  transaction: "txn",
  version: "txn",
  txn: "txn",
};

export const toExplorerLink = ({
  value,
  linkType: t,
  network = APTOS_NETWORK,
}: {
  value: AnyNumberString;
  linkType: keyof typeof linkTypes;
  network?: string;
}) => {
  const type = linkTypes[t] ?? "txn";
  return `https://explorer.aptoslabs.com/${type}/${value}?network=${network}`;
};
