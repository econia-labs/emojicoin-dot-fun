import { APTOS_NETWORK } from "lib/env";

export const toExplorerLink = ({
  value,
  linkType: type,
  network = APTOS_NETWORK,
}: {
  value: string | number;
  linkType: "acc" | "account" | "transaction" | "version" | "txn";
  network?: string;
}) => {
  if (type === "account" || type === "acc") {
    return `https://explorer.aptoslabs.com/account/${value}?network=${network}`;
  }
  return `https://explorer.aptoslabs.com/txn/${value}?network=${network}`;
};
