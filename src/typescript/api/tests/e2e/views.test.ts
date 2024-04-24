import { AccountAddress, type HexInput } from "@aptos-labs/ts-sdk";
import * as EmojicoinDotFun from "../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getTestHelpers } from "../utils";

jest.setTimeout(30000);

describe("it tests view functions", () => {
  const { aptos, publisher, publishPackageResult } = getTestHelpers();

  it("it tests several different emojis that are and aren't supported", async () => {
    const publishResult = publishPackageResult;

    expect(AccountAddress.from(publishResult.sender).toStringLong()).toEqual(
      publisher.accountAddress.toStringLong()
    );
    expect(publishResult.success).toEqual(true);

    const transactionHash = publishResult.transaction_hash;
    await aptos.waitForTransaction({ transactionHash });
    expect(publisher.accountAddress.toStringLong()).toEqual(
      publisher.accountAddress.toStringLong()
    );

    const testIsSupported = async (hex: HexInput, expected: boolean) => {
      const view = new EmojicoinDotFun.IsASupportedEmoji({
        moduleAddress: publisher.accountAddress.toStringLong(),
        hexBytes: hex,
      });
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
