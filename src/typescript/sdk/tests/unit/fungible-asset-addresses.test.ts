import { AccountAddress, pairedFaMetadataAddress } from "@aptos-labs/ts-sdk";

import type { SymbolEmoji } from "../../src";
import {
  getMarketAddress,
  getPrimaryFungibleStoreAddress,
  removeLeadingZerosFromStructString,
  toEmojicoinTypes,
} from "../../src";
import { ensureTypeTagStruct } from "../../src/utils/type-tags";

describe("tests to derive emojicoin fungible asset primary store and metadata addresses", () => {
  it("gets the same metadata address with or without leading zero on the input", () => {
    // THe market address has a leading zero. Check if the metadata address derivation function
    // returns the same value regardless of the input.
    expect(pairedFaMetadataAddress("0x00001234fa999900::test::thing").toString()).toEqual(
      pairedFaMetadataAddress("0x1234fa999900::test::thing").toString()
    );
  });

  it("derives the metadata address correctly for a market address with NO leading zero", () => {
    const coinType = ensureTypeTagStruct(
      "0xfca067cba8d5ed29b0b12bc32037cc46d257568bde578b669e377929996a03ed::coin_factory::Emojicoin"
    );
    const metadataAddress = pairedFaMetadataAddress(coinType.toString());
    const expected = AccountAddress.from(
      "0x8c252a96183d90392399fe3d97541f8c6fd87de9479ad2a9416bb656ad1fc7aa"
    );
    expect(metadataAddress.toString()).toEqual(expected.toString());
  });

  // All expected values taken directly from the writeset changes of a real transaction.
  it("derives the primary fungible store address correctly for a market address with NO leading zero", () => {});

  it("derives the metadata address correctly for a market address WITH a leading zero", () => {
    const symbol: SymbolEmoji[] = ["💴"];
    const marketAddress = getMarketAddress(symbol);
    expect(marketAddress.toString()).toEqual(
      AccountAddress.from(
        "0x0e1aa62a38f6916093fe3bd7c85f7cb8ce87886c8464b80e6092e52b4a168d32"
      ).toString()
    );
    expect(marketAddress.toStringLong().startsWith("0x0")).toBe(true);
    const { emojicoin } = toEmojicoinTypes(marketAddress);

    const coinType = ensureTypeTagStruct(emojicoin);
    const metadata = pairedFaMetadataAddress(coinType.toString());
    const withLeading = removeLeadingZerosFromStructString(coinType.toString());
    const metadataFromLeading = pairedFaMetadataAddress(withLeading);
    const expected = AccountAddress.from(
      "0xdf135b252b998530ead39a5b5acfde7dbc64be7fef0facc60da8dacbfc346d03"
    );
    expect(metadataFromLeading.toString()).toEqual(expected.toString());
    expect(metadata.toString()).toEqual(expected.toString());

    console.warn({
      ownerAddress: "0x0834d715bdc485e371fd2e9fdb185dde0b801e924d327297cacd1972a7dee083",
      metadataAddress: metadata,
      primaryStoreAddress: getPrimaryFungibleStoreAddress({
        ownerAddress: "0x0834d715bdc485e371fd2e9fdb185dde0b801e924d327297cacd1972a7dee083",
        metadataAddress: metadata,
      }).toString(),
    });
  });

  it("derives the primary fungible store address correctly for an address WITH a leading zero", () => {
    const coinType =
      "0x58f40ecd236f430c28e30699bf8a7f478c6e4efe9c6d6a2227a86f41e1f0e44::coin_factory::EmojicoinLP";
    expect(coinType.split("::").at(0)!).toHaveLength(65);
    const metadataAddress = "0xf4c801d6592ecf9c24bfe60b505913576ff8e7b12937adb41b0e37e1b4a11a8d";
    expect(pairedFaMetadataAddress(coinType).toString()).toEqual(metadataAddress);
    const expectedPrimaryStoreAddress =
      "0xc6e60ab1124a56340889861289be47b1cf6f62f5ce0e4ba6871d8400ef0b712e";
    const ownerAddress = "0x5048c88ba0ab78f78f4da8d2c3c3a35078315a79e28f8e223c1522761d0eec64";
    expect(getPrimaryFungibleStoreAddress({ ownerAddress, metadataAddress }).toString()).toEqual(
      expectedPrimaryStoreAddress
    );
  });
});
