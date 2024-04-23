import { Account, Network, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getAptosClient } from "../../src/helpers/aptos-client";
import { publishPackage } from "../../src/cli/publish";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, ONE_APT } from "../../src";

jest.setTimeout(60000);
jest.retryTimes(3);

describe("tests publishing modules to a local network", () => {
  const { aptos } = getAptosClient();
  const publisher = Account.generate();

  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: publisher.accountAddress, amount: ONE_APT });
    await aptos.fundAccount({ accountAddress: publisher.accountAddress, amount: ONE_APT });
  });

  it("publishes a nearly blank smart contract", async () => {
    const moduleName = "main";
    const packageName = "template";
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
  });

  it("publishes the emojicoin_dot_fun smart contract", async () => {
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
  });
});
