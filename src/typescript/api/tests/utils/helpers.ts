import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import findGitRoot from "find-git-root";
import { getAptosClient } from "./aptos-client";
import { type TestHelpers } from "./types";

/**
 * Facilitates the usage of a constant Aptos Account and client for testing the publishing
 * flow. Instead of having to republish every account for every test that needs it, we can
 * just store these things in the globalThis and get them from this function.
 * @returns TestHelpers
 */
export function getTestHelpers(): TestHelpers {
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

/**
 * Returns the path to the root of the repository by removing
 * the .git directory from the path.
 *
 * @returns the path to the closest .git directory.
 */
export function getGitRoot(): string {
  const gitRoot = findGitRoot(process.cwd());
  return path.dirname(gitRoot);
}
