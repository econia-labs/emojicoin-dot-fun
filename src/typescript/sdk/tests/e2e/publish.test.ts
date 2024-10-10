import { AccountAddress, Network, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getModuleExists, publishPackage } from "../../src/utils/test/publish";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS, ONE_APT } from "../../src";
import { getPublishHelpers } from "../../src/utils/test";

jest.setTimeout(60000);
jest.retryTimes(3);

describe("tests publishing modules to a local network", () => {
  const { aptos, publisher } = getPublishHelpers();

  it("publishes a nearly blank smart contract", async () => {
    await aptos.fundAccount({
      accountAddress: publisher.accountAddress.toString(),
      amount: ONE_APT,
    });
    const moduleName = "main";
    const packageName = "template";
    const publishResult = await publishPackage({
      privateKey: publisher.privateKey,
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

  it("ensure the emojicoin_dot_fun smart contract is published", async () => {
    const accountResources = await aptos.getAccountModule({
      accountAddress: MODULE_ADDRESS,
      moduleName: EMOJICOIN_DOT_FUN_MODULE_NAME,
    });
    expect(accountResources.abi).toBeDefined();
    const moduleExists = await getModuleExists(MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME);
    expect(moduleExists).toBe(true);
  });
});
