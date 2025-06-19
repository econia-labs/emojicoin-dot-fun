import {
  AccountAddress,
  type MoveResource,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

import type { Flatten, JsonTypes, ObjectAddressStruct, Types, Uint64String } from "..";
import { toEventHandle } from "./types";

export type CoinAndFungibleAssetJsonTypes = {
  CoinStore: {
    coin: {
      value: Uint64String;
    };
    frozen: boolean;
    deposit_events: JsonTypes["EventHandle"];
    withdraw_events: JsonTypes["EventHandle"];
  };
  CoinStoreWriteSetChange: Flatten<
    WriteSetChangeWriteResource & {
      data: MoveResource & { data: CoinAndFungibleAssetJsonTypes["CoinStore"] };
    }
  >;
  FungibleStore: {
    metadata: ObjectAddressStruct;
    balance: Uint64String;
    frozen: boolean;
  };
  FungibleStoreWriteSetChange: Flatten<
    WriteSetChangeWriteResource & {
      data: MoveResource & { data: CoinAndFungibleAssetJsonTypes["FungibleStore"] };
    }
  >;
};

export type CoinAndFungibleAssetTypes = {
  CoinStore: {
    coin: {
      value: bigint;
    };
    frozen: boolean;
    depositEvents: Types["EventHandle"];
    withdrawEvents: Types["EventHandle"];
  };
  FungibleStore: {
    metadata: {
      inner: AccountAddress;
    };
    balance: bigint;
    frozen: boolean;
  };
};

export const toCoinStore = (
  data: CoinAndFungibleAssetJsonTypes["CoinStore"]
): CoinAndFungibleAssetTypes["CoinStore"] => ({
  coin: {
    value: BigInt(data.coin.value),
  },
  frozen: data.frozen,
  depositEvents: toEventHandle(data.deposit_events),
  withdrawEvents: toEventHandle(data.withdraw_events),
});

export const toFungibleStore = (
  data: CoinAndFungibleAssetJsonTypes["FungibleStore"]
): CoinAndFungibleAssetTypes["FungibleStore"] => ({
  metadata: {
    inner: AccountAddress.from(data.metadata.inner),
  },
  balance: BigInt(data.balance),
  frozen: data.frozen,
});
