import { AccountAddress, Network, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, ONE_APT } from "@econia-labs/emojicoin-common";
import { getModuleExists, getTestHelpers, publishPackage } from "@econia-labs/emojicoin-test-utils";

jest.setTimeout(60000);
jest.retryTimes(3);

describe("tests publishing modules to a local network", () => {
  const { aptos, publisher, publishPackageResult } = getTestHelpers();

  it("publishes a nearly blank smart contract", async () => {
    await aptos.fundAccount({
      accountAddress: publisher.accountAddress.toString(),
      amount: ONE_APT,
    });
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

    const moduleExists = await getModuleExists(publisher.accountAddress, moduleName);
    expect(moduleExists).toBe(true);
  });

  it("publishes the emojicoin_dot_fun smart contract", async () => {
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
      moduleName: EMOJICOIN_DOT_FUN_MODULE_NAME,
    });
    expect(accountResources.abi).toBeDefined();
    const moduleExists = await getModuleExists(
      publisher.accountAddress,
      EMOJICOIN_DOT_FUN_MODULE_NAME
    );
    expect(moduleExists).toBe(true);
  });
});
