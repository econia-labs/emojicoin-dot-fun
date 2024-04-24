import { type Aptos, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import { getAptosClient } from "../../src";
import { type PublishPackageResult } from "../../src/cli/types";
import { getGitRoot } from "../../src/utils/helpers";

export type TestHelpers = {
  aptos: Aptos;
  publisher: Account;
  publishPackageResult: PublishPackageResult;
};

/**
 * Facilitates the usage of a constant Aptos Account and client for testing the publishing
 * flow. Instead of having to republish every account for every test that needs it, we can
 * just store these things in the globalThis and get them from this function.
 * @returns TestHelpers
 */
export default function getHelpers(): TestHelpers {
  const { aptos } = getAptosClient();

  const pkPath = path.join(getGitRoot(), ".tmp", ".pk");
  const publishResPath = path.join(getGitRoot(), ".tmp", ".publish_result");

  const pk = fs.readFileSync(path.resolve(pkPath)).toString();
  const publisher = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(pk) });
  const publishPackageResult = JSON.parse(fs.readFileSync(path.resolve(publishResPath)).toString());

  return {
    aptos,
    publisher,
    publishPackageResult,
  };
}
