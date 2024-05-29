import { Account, Ed25519PrivateKey, Hex } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import { getAptosClient } from "./aptos-client";
import { type TestHelpers } from "./types";
import { getGitRoot } from "../../src/utils/git-root";

export const TS_UNIT_TEST_DIR = path.join(getGitRoot(), "src/typescript/sdk/tests");
export const PK_PATH = path.resolve(path.join(TS_UNIT_TEST_DIR, ".tmp", ".pk"));
export const PUBLISH_RES_PATH = path.resolve(
  path.join(TS_UNIT_TEST_DIR, ".tmp", ".publish_result")
);

/**
 * Facilitates the usage of a constant Aptos Account and client for testing the publishing
 * flow. Instead of having to republish every account for every test that needs it, we can
 * just store these things in the globalThis and get them from this function.
 * @returns TestHelpers
 */
export function getTestHelpers(): TestHelpers {
  const { aptos } = getAptosClient();

  const pk = fs.readFileSync(PK_PATH).toString();
  const publisher = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(Hex.fromHexString(pk).toUint8Array()),
  });
  const publishPackageResult = JSON.parse(fs.readFileSync(PUBLISH_RES_PATH).toString());

  return {
    aptos,
    publisher,
    publishPackageResult,
  };
}
