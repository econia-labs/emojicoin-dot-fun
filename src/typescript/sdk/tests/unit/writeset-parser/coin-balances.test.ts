// cspell:word localnet

import {
  Account,
  Ed25519PrivateKey,
  pairedFaMetadataAddress,
  PrivateKey,
  PrivateKeyVariants,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

import type { SymbolEmoji } from "../../../src";
import {
  APTOS_COIN_TYPE_STRING,
  ensureTypeTagStruct,
  getAptBalanceFromWriteSetChanges,
  getBalanceFromWriteSetChanges,
  getMarketAddress,
  getPrimaryFungibleStoreAddress,
  toEmojicoinTypes,
} from "../../../src";
import SwapBuyWithLeadingZeroAddressesJson from "./json/emojicoin-swaps/leading-zeros/buy.json";

const SwapBuyWithLeadingZerosResponse =
  SwapBuyWithLeadingZeroAddressesJson as UserTransactionResponse;

describe("APT and emojicoin balance parsing tests", () => {
  it("parses a basic swap correctly with leading zeros everywhere", () => {
    const symbol: SymbolEmoji[] = ["☹️", "♿"];
    // Note that the market address was derived on localnet with the 0xf00d publisher.
    const expected = {
      marketAddress: "0x02f240a0a457b74e7eaf8f609ba2fe12e4e163c4593a0f9e522eb7526e879034",
      // Note that the `emojicoin` coin store was used here, not the `emojicoinLP` store.
      metadataAddress: "0x0c50df83e8c1db62f9ff7c51a7f3075c82ef281515df28c0fd790df72a9f5c66",
      ownerAddress: "0x08a970c81d33342a19f5b3dd2f0976f74426728011f1c4bf3098639c68817b05",
      primaryStore: "0x0d8e0ac29dc5cc73603b303a5be1bc56dc7a469492d06b817d18e718edfddcd2",
      // These can be found in the write set changes directly as strings.
      // Note that these are all from a simple swap buy with an `inputAmount` of 2 APT.
      userEmojicoinBalance: 24135529130802n,
      marketEmojicoinBalance: 4475864470869198n,
      userAptBalance: 999999599077900n,
      marketAptBalance: 198000000n,
    } as const;

    const user = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(
        PrivateKey.formatPrivateKey(
          "0xf8195349cc4ffab9abc5103a051b83860a02efd6399083f3729d07da53c46c04",
          PrivateKeyVariants.Ed25519
        )
      ),
    });
    const { emojicoin } = toEmojicoinTypes(expected.marketAddress);
    const coinType = ensureTypeTagStruct(emojicoin).toString();
    const ownerAddress = user.accountAddress;

    expect(ownerAddress.toStringLong()).toEqual(expected.ownerAddress);
    expect(getMarketAddress(symbol).toStringLong()).toEqual(expected.marketAddress);
    expect(pairedFaMetadataAddress(coinType).toStringLong()).toEqual(expected.metadataAddress);
    expect(
      getPrimaryFungibleStoreAddress({
        ownerAddress: user.accountAddress,
        metadataAddress: pairedFaMetadataAddress(coinType),
      }).toStringLong()
    ).toEqual(expected.primaryStore);

    const response = SwapBuyWithLeadingZerosResponse;

    // Get the emojicoin balance.
    const userEmojicoinBalance = getBalanceFromWriteSetChanges({
      response,
      ownerAddress,
      coinType: emojicoin,
    });

    // For good measure, get the market's new emojicoin balance, too.
    const marketEmojicoinBalance = getBalanceFromWriteSetChanges({
      response,
      ownerAddress: expected.marketAddress,
      coinType: emojicoin,
    });

    // Get the user's APT balance.
    const userAptBalance = getBalanceFromWriteSetChanges({
      response,
      ownerAddress,
      coinType: APTOS_COIN_TYPE_STRING,
    });

    // Get it again with the helper function.
    const userAptBalance2 = getAptBalanceFromWriteSetChanges(response, ownerAddress);

    // Get the market APT balance.
    const marketAptBalance = getBalanceFromWriteSetChanges({
      response,
      ownerAddress: expected.marketAddress,
      coinType: APTOS_COIN_TYPE_STRING,
    });

    // Get again with the helper function.
    const marketAptBalance2 = getAptBalanceFromWriteSetChanges(response, expected.marketAddress);

    // Verify they're all the expected values.
    expect(userEmojicoinBalance).toEqual(expected.userEmojicoinBalance);
    expect(marketEmojicoinBalance).toEqual(expected.marketEmojicoinBalance);
    expect(userAptBalance).toEqual(expected.userAptBalance);
    expect(userAptBalance2).toEqual(expected.userAptBalance);
    expect(marketAptBalance).toEqual(expected.marketAptBalance);
    expect(marketAptBalance2).toEqual(expected.marketAptBalance);
  });
});
