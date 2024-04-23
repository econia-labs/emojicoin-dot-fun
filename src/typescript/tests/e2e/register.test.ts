import { Account, Network, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getAptosClient } from "../../src/helpers/aptos-client";
import { fundAccounts } from "../../src/helpers/fund-accounts";
import { publishPackage } from "../../src/cli/publish";
import {
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  deriveEmojicoinPublisherAddress,
  getRegistryAddress,
} from "../../src";
import { RegisterMarket } from "../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";

jest.setTimeout(30000);

describe("registers a market successfully", () => {
  const { aptos } = getAptosClient();
  const publisher = Account.generate();
  const user = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [publisher, user]);
    await fundAccounts(aptos, [publisher]);
  });

  it.only("publishes the emojicoin_dot_fun smart contract", async () => {
    const moduleName = EMOJICOIN_DOT_FUN_MODULE_NAME;
    const packageName = moduleName;
    const publishResult = await publishPackage({
      pk: publisher.privateKey,
      includedArtifacts: "none",
      namedAddresses: {
        [packageName]: publisher.accountAddress,
      },
      network: Network.LOCAL,
      packageDirRelativeToRoot: `src/move/${packageName}`,
    });

    expect(publishResult.sender.toStringLong()).toEqual(publisher.accountAddress.toStringLong());
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

    const txResponse = await RegisterMarket.submit({
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
  });
});
