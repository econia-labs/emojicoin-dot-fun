import type { WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";

import {
  isACoinStoreWriteResource,
  isAPrimaryStoreWriteResource,
  isWriteSetChangeWriteResource,
} from "../../../src";
import CoinStore from "./json/coin-store.json";
import PrimaryStore from "./json/fungible-store.json";

const coinStoreAsWriteResource = CoinStore as WriteSetChangeWriteResource;
const primaryStoreAsWriteResource = PrimaryStore as WriteSetChangeWriteResource;

describe("tests to parse writeset resource changes", () => {
  it("properly parses a coin store change", () => {
    expect(isWriteSetChangeWriteResource(coinStoreAsWriteResource)).toBe(true);
    expect(isACoinStoreWriteResource(coinStoreAsWriteResource)).toBe(true);
  });

  it("properly parses a fungible store change", () => {
    expect(isWriteSetChangeWriteResource(primaryStoreAsWriteResource)).toBe(true);
    expect(isAPrimaryStoreWriteResource(primaryStoreAsWriteResource)).toBe(true);
  });
});
