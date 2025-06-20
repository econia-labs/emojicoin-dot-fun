import {
  AccountAddress,
  pairedFaMetadataAddress,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

import {
  APTOS_COIN_TYPE_STRING,
  ensureTypeTagStruct,
  getAptBalanceFromWriteSetChanges,
  getBalanceFromWriteSetChanges,
  getPrimaryFungibleStoreAddress,
  toEmojicoinTypes,
} from "../../../src";
import BasicSwapLeadingZerosJson from "./json/emojicoin-basic-swap-leading-zeros.json";

const BasicSwapWithLeadingZerosTxnResponse = BasicSwapLeadingZerosJson as UserTransactionResponse;

describe("APT and emojicoin balance parsing tests", () => {
  it("parses a basic swap correctly with leading zeros everywhere", () => {
    const response = BasicSwapWithLeadingZerosTxnResponse;
    const ownerAddress = "0x029665e58596cb0b1e7e1efb033d4371505aa26ee3a47c21ae4462098207d6c0";
    const marketAddress = "0x4fa4eda9333d5e70d91469de644a30b20bb5e5bda4c96b1de65686ced3ebfe53";
    const { emojicoin } = toEmojicoinTypes(marketAddress);
    const emojicoinMetadataAddress = pairedFaMetadataAddress(
      ensureTypeTagStruct(emojicoin).toString()
    );

    // Check the emojicoin primary store address.
    const emojicoinPrimaryStore = getPrimaryFungibleStoreAddress({
      ownerAddress,
      metadataAddress: emojicoinMetadataAddress,
    });
    const expectedEmojicoinPrimaryStore = AccountAddress.from(
      "0x85c205e0cb08020f3a8eab41044610e364068ad2ba9b5f6fdd2c4d39ff70c0e3"
    ).toString();
    expect(emojicoinPrimaryStore.toString()).toEqual(expectedEmojicoinPrimaryStore.toString());

    // Check the emojicoin balance.
    const emojicoinBalanceUser = getBalanceFromWriteSetChanges({
      response,
      ownerAddress,
      coinType: emojicoin,
    });
    expect(emojicoinBalanceUser).toEqual(12097319416221n)

    // Check the APT primary store address.

    // Check the APT balance.
    const aptBalanceUser = getBalanceFromWriteSetChanges({
      response,
      ownerAddress,
      coinType: APTOS_COIN_TYPE_STRING,
    });
    expect(aptBalanceUser).toEqual()

    // Check it again with the helper function.
    const aptBalanceUser2 = getAptBalanceFromWriteSetChanges(response, ownerAddress);
  });
});
