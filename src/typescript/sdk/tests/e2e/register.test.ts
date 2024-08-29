import { Ed25519Account, AccountAddress, Hex, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  COIN_FACTORY_MODULE_NAME,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  ONE_APT,
  deriveEmojicoinPublisherAddress,
  getMarketResource,
  getRegistryAddress,
} from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getPublishHelpers } from "../utils";
import { standardizeAddress } from "../../src/utils/account-address";
import { getFundedAccount } from "../utils/test-accounts";

jest.setTimeout(20000);

describe("registers a market successfully", () => {
  const { aptos, publisher, publishPackageResult } = getPublishHelpers();
  const user = getFundedAccount(
    "0x000276e7908d952b7639672a07da760969c7791315fdde140c00228427fe6000"
  );

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

    const randomIntegrator = Ed25519Account.generate();

    const emojis = ["f09fa693", "f09fa79f"];

    const txResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant: user,
      emojis,
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
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
      objectAddress: derivedNamedObjectAddress,
    });

    const { marketID, marketAddress, emojiBytes } = marketObjectMarketResource.metadata;

    const { lpCoinSupply, extendRef } = marketObjectMarketResource;

    expect(marketID).toBeGreaterThanOrEqual(1n);
    expect(Hex.fromHexInput(emojiBytes).toString()).toEqual(`0x${emojis.join("")}`);
    expect(emojiBytes).toEqual(Hex.fromHexString(emojis.join("")).toUint8Array());
    expect(extendRef.self).toEqual(standardizeAddress(derivedNamedObjectAddress));
    expect(extendRef.self).toEqual(standardizeAddress(marketAddress));
    expect(lpCoinSupply).toEqual(0n);

    const marketObjectResources = await aptos.getAccountModule({
      accountAddress: derivedNamedObjectAddress,
      moduleName: COIN_FACTORY_MODULE_NAME,
    });
    const structAbis = marketObjectResources.abi?.structs;
    const expectedStructAbis = [
      {
        name: "Emojicoin",
        is_event: false,
        is_native: false,
        abilities: [],
        generic_type_params: [],
        fields: [{ name: "dummy_field", type: "bool" }],
      },
      {
        name: "EmojicoinLP",
        is_event: false,
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
