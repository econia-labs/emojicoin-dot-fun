import { AccountAddress } from "@aptos-labs/ts-sdk";
import { deriveEmojicoinPublisherAddress } from "../../src";

describe("it derives emojicoin addresses correctly", () => {
  it("derives the named object address from hex string emojis correctly", async () => {
    const registryAddress = AccountAddress.from(
      "0x423bb7b3a7c0e1ddb761ca8389f797cf2e0c81d5c407327e5e5b45a72b5ed421"
    );
    const expectedObjectAddress = AccountAddress.from(
      "0x2250d03d164dc3b341d927f65858d8fa8f12ee83aaab4d16dff7308e437bfcbf"
    );
    const emojis = ["f09fa693", "f09fa79f"];

    const derivedNamedObjectFromRawEmojis = deriveEmojicoinPublisherAddress({
      registryAddress,
      emojis,
    });

    expect(derivedNamedObjectFromRawEmojis.toStringLong()).toEqual(
      expectedObjectAddress.toStringLong()
    );
  });
});
