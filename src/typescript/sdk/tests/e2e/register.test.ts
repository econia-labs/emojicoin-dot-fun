import { Ed25519Account, Hex } from "@aptos-labs/ts-sdk";
import {
  COIN_FACTORY_MODULE_NAME,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  ONE_APT,
  SYMBOL_EMOJI_DATA,
  deriveMarketAddress,
  getMarketResource,
  getRegistryAddress,
} from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getPublishHelpers } from "../../src/utils/test";
import { standardizeAddress } from "../../src/utils/account-address";
import { getFundedAccount } from "../../src/utils/test/test-accounts";

jest.setTimeout(20000);

describe("registers a market successfully", () => {
  const { aptos, publisher } = getPublishHelpers();
  const user = getFundedAccount("000");

  it("publishes the emojicoin_dot_fun package and queries the expected resources", async () => {
    const moduleName = EMOJICOIN_DOT_FUN_MODULE_NAME;
    const accountResources = await aptos.getAccountModule({
      accountAddress: publisher.accountAddress,
      moduleName,
    });
    expect(accountResources.abi).toBeDefined();

    const randomIntegrator = Ed25519Account.generate();

    // As actual emojis: ["🦓", "🧟"];
    const symbolBytes = ["0xf09fa693" as const, "0xf09fa79f" as const];

    const txResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant: user,
      emojis: symbolBytes,
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

    const emojis = symbolBytes
      .map(SYMBOL_EMOJI_DATA.byHex)
      .filter((emoji) => typeof emoji !== "undefined")
      .map(({ emoji }) => emoji);
    expect(emojis.length).toEqual(symbolBytes.length);
    const derivedNamedObjectAddress = deriveMarketAddress(emojis, registryAddress);

    const publisherObjectResources = await aptos.getAccountResources({
      accountAddress: derivedNamedObjectAddress,
    });

    expect(publisherObjectResources).toBeDefined();

    const marketObjectMarketResource = await getMarketResource({
      aptos,
      marketAddress: derivedNamedObjectAddress,
    });

    const { marketID, marketAddress, emojiBytes } = marketObjectMarketResource.metadata;

    const { lpCoinSupply, extendRef } = marketObjectMarketResource;

    expect(marketID).toBeGreaterThanOrEqual(1n);
    const fullHex = `0x${symbolBytes.map((e) => e.replace(/^0x/, "")).join("")}` as const;
    expect(Hex.fromHexInput(emojiBytes).toString()).toEqual(fullHex);
    expect(emojiBytes).toEqual(Hex.fromHexString(fullHex).toUint8Array());
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
