import { Account, AccountAddress, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  COIN_FACTORY_MODULE_NAME,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  deriveEmojicoinPublisherAddress,
  getMarketResource,
  getRegistryAddress,
} from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getTestHelpers } from "../utils";

jest.setTimeout(30000);

describe("registers a market successfully", () => {
  const { aptos, publisher, publishPackageResult } = getTestHelpers();

  it("publishes the emojicoin_dot_fun package and queries the expected resources", async () => {
    const moduleName = EMOJICOIN_DOT_FUN_MODULE_NAME;
    const publishResult = publishPackageResult;

    expect(AccountAddress.from(publishResult.sender).toStringLong()).toEqual(
      publisher.accountAddress.toStringLong()
    );
    expect(publishResult.success).toEqual(true);

    const transactionHash = publishResult.transaction_hash;
    const response = await aptos.waitForTransaction({ transactionHash });
    expect(isUserTransactionResponse(response)).toBe(true);

    const accountResources = await aptos.getAccountModule({
      accountAddress: publisher.accountAddress,
      moduleName,
    });
    expect(accountResources.abi).toBeDefined();

    const randomIntegrator = Account.generate();

    const emojis = ["f09fa693", "f09fa79f"];

    const txResponse = await EmojicoinDotFun.RegisterMarket.submit({
      moduleAddress: publisher.accountAddress,
      aptosConfig: aptos.config,
      registrant: publisher,
      emojis,
      integrator: randomIntegrator.accountAddress,
    });

    expect(txResponse.success).toBe(true);

    const registryAddress = await getRegistryAddress({
      aptos,
      moduleAddress: publisher.accountAddress,
    });

    const derivedNamedObjectAddress = deriveEmojicoinPublisherAddress({
      registryAddress,
      emojis,
    });

    const publisherObjectResources = await aptos.getAccountResources({
      accountAddress: derivedNamedObjectAddress,
    });

    expect(publisherObjectResources).toBeDefined();

    const marketObjectMarketResource = await getMarketResource({
      aptos,
      moduleAddress: publisher.accountAddress,
      objectAddress: derivedNamedObjectAddress,
    });

    const {
      market_id: marketId,
      market_address: marketAddress,
      emoji_bytes: emojiBytes,
    } = marketObjectMarketResource.metadata;

    const { lp_coin_supply: lpCoinSupply, extend_ref: extendRef } = marketObjectMarketResource;

    expect(marketId).toEqual(1n);
    expect(emojiBytes.toString()).toEqual(`0x${emojis[0]}${emojis[1]}`);
    expect(extendRef.self.toStringLong()).toEqual(derivedNamedObjectAddress.toStringLong());
    expect(extendRef.self.toStringLong()).toEqual(marketAddress.toStringLong());
    expect(lpCoinSupply).toEqual(0n);

    const marketObjectResources = await aptos.getAccountModule({
      accountAddress: derivedNamedObjectAddress,
      moduleName: COIN_FACTORY_MODULE_NAME,
    });
    const structAbis = marketObjectResources.abi?.structs;
    const expectedStructAbis = [
      {
        name: "Emojicoin",
        is_native: false,
        abilities: [],
        generic_type_params: [],
        fields: [{ name: "dummy_field", type: "bool" }],
      },
      {
        name: "EmojicoinLP",
        is_native: false,
        abilities: [],
        generic_type_params: [],
        fields: [{ name: "dummy_field", type: "bool" }],
      },
    ];
    expect(structAbis).toBeDefined();
    expect(structAbis).toStrictEqual(expectedStructAbis);
  });
});
