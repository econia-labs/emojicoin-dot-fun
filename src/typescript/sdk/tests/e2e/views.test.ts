import { AccountAddress, Hex, type HexInput } from "@aptos-labs/ts-sdk";
import { getTestHelpers } from "@econia-labs/emojicoin-test-utils";
import * as EmojicoinDotFun from "../../src/emojicoin_dot_fun/emojicoin-dot-fun";

jest.setTimeout(15000);

describe("view functions", () => {
  const { aptos, publisher, publishPackageResult } = getTestHelpers();

  it("tests several different emojis that are and aren't supported", async () => {
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
      const supported = await EmojicoinDotFun.IsASupportedSymbolEmoji.view({
        aptos,
        hexBytes: hex,
      });
      expect(supported).toEqual(expected);
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

  it("tests verified symbol emoji bytes", async () => {
    const emojis = ["f09fa693", "f09fa79f"];
    const response = await EmojicoinDotFun.VerifiedSymbolEmojiBytes.view({
      aptos,
      emojis,
    });
    const expectedHexString = "0xf09fa693f09fa79f";
    const expectedHexBytes = Hex.fromHexString(expectedHexString).toUint8Array();
    expect(response).toEqual(expectedHexString);
    expect(Hex.fromHexString(emojis.join("")).toUint8Array()).toEqual(expectedHexBytes);
  });
});
