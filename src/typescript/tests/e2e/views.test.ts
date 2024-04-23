import { Account, type HexInput, Network } from "@aptos-labs/ts-sdk";
import { getAptosClient } from "../../src/helpers/aptos-client";
import { fundAccounts } from "../../src/helpers/fund-accounts";
import { publishPackage } from "../../src/cli/publish";
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "../../src";
import * as EmojicoinDotFun from "../../src/emojicoin_dot_fun/emojicoin-dot-fun";

jest.setTimeout(30000);

describe("it tests view functions", () => {
  const { aptos } = getAptosClient();
  const publisher = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [publisher]);
    await fundAccounts(aptos, [publisher]);
  });

  it("it tests several different emojis that are and aren't supported", async () => {
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
    await aptos.waitForTransaction({ transactionHash });
    const moduleAddress = publisher.accountAddress.toString();

    const testIsSupported = async (hex: HexInput, expected: boolean) => {
      const view = new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: hex });
      expect(await view.submit({ aptos })).toEqual([expected]);
    };

    await testIsSupported("e298afefb88f", true);
    await testIsSupported(new Uint8Array([240, 159, 167, 159]), true);
    await testIsSupported("f09faa80", true);
    await testIsSupported("f09fa693", true);
    await testIsSupported("f09fa611", false);
    await testIsSupported("f09fa691", true);
    await testIsSupported("f09f8f9fefb88f", true);
    await testIsSupported("e2ad90", true);
    await testIsSupported("e2ad90ff", false);
    await testIsSupported("00e2ad90ff", false);
  });
});
