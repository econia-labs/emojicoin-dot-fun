import { Account, Network } from "@aptos-labs/ts-sdk";
import { getAptosClient } from "../../src/helpers/aptos-client";
import { fundAccounts } from "../../src/helpers/fund-accounts";
import { publishPackage } from "../../src/cli/publish";
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "../../src";
import * as EmojicoinDotFun from "../../src/emojicoin_dot_fun/emojicoin-dot-fun";

jest.setTimeout(30000);

describe("registers a market successfully", () => {
  const { aptos } = getAptosClient();
  const publisher = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [publisher]);
    await fundAccounts(aptos, [publisher]);
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
    await aptos.waitForTransaction({ transactionHash });
    const moduleAddress = publisher.accountAddress.toString();

    const emojis = [
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "e298afefb88f" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({
        moduleAddress,
        hex_bytes: new Uint8Array([240, 159, 167, 159]),
      })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "f09faa80" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "f09fa693" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "f09fa611" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "f09fa691" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "f09f8f9fefb88f" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "e2ad90" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "e2ad90ff" })
        .submit({ aptos })
        .then((resp) => resp[0]),
      new EmojicoinDotFun.IsASupportedEmoji({ moduleAddress, hex_bytes: "00e2ad90ff" })
        .submit({ aptos })
        .then((resp) => resp[0]),
    ];
    const supported = await Promise.all(emojis);
    expect(supported).toEqual([true, true, true, true, false, true, true, true, false, false]);
  });
});
