import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun/types";

export const QueryKey = {
  "use-user-escrows": (userAddress?: AccountAddressInput) => [
    "use-user-escrows",
    userAddress ? AccountAddress.from(userAddress).toString() : undefined,
  ],
} as const;
