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

describe("it derives emojicoin addresses correctly", () => {
  it("derives the named object address correctly from both raw emojis and hex string emojis", async () => {
    const registryAddress = Account.generate().accountAddress;
    const emojis = ["f09fa693", "f09fa79f"];

    const derivedNamedObjectFromRawEmojis = deriveEmojicoinPublisherAddress({
      registryAddress,
      emojis,
    });

    console.log(derivedNamedObjectFromRawEmojis.bcsToHex().toString());
  });
});
