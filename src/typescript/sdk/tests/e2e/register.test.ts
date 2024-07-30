import { Account, AccountAddress, Hex, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  COIN_FACTORY_MODULE_NAME,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  ONE_APT,
  deriveEmojicoinPublisherAddress,
  getMarketResource,
  getRegistryAddress,
} from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getTestHelpers } from "../utils";
import { normalizeAddress } from "../../src/utils/account-address";

jest.setTimeout(20000);

describe("registers a market successfully", () => {
  const { aptos, publisher, publishPackageResult } = getTestHelpers();
  const user = Account.generate();

  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: user.accountAddress, amount: ONE_APT });
    await aptos.fundAccount({ accountAddress: user.accountAddress, amount: ONE_APT });
  });

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
    expect(normalizeAddress(extendRef.self)).toEqual(normalizeAddress(derivedNamedObjectAddress));
    expect(normalizeAddress(extendRef.self)).toEqual(normalizeAddress(marketAddress));
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
