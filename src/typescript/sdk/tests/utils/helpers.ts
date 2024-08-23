import { Account, AccountAddress, Ed25519PrivateKey, Hex, TypeTag } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import findGitRoot from "find-git-root";
import { fundAccountFast, getAptosClient } from "./aptos-client";
import { type TestHelpers } from "./types";
import { AnyEmojiName, SYMBOL_DATA } from "../../src/emoji_data/symbol-data";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets/utils";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { ONE_APT, symbolBytesToEmojis } from "../../src";

export const TS_UNIT_TEST_DIR = path.join(getGitRoot(), "src/typescript/sdk/tests");
export const PK_PATH = path.resolve(path.join(TS_UNIT_TEST_DIR, ".tmp", ".pk"));
export const PUBLISH_RES_PATH = path.resolve(
  path.join(TS_UNIT_TEST_DIR, ".tmp", ".publish_result")
);

/**
 * Facilitates the usage of a constant Aptos Account and client for testing the publishing
 * flow. Instead of having to republish every account for every test that needs it, we can
 * just store these things in the globalThis and get them from this function.
 *
 * NOTE: This function returns test specific data, so using it will result in unexpected behavior
 * unless you know what you're doing.
 *
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

export async function registerMarketTestHelper({
  emojiNames,
  registrant = Account.generate(),
  integrator = Account.generate(),
}: {
  emojiNames: Array<AnyEmojiName>;
  registrant?: Account;
  additionalAccountsToFund?: Array<Account>;
  integrator?: Account;
}) {
  const { aptos } = getTestHelpers();
  const emojis = emojiNames.map((name) => SYMBOL_DATA.byStrictName(name));
  const symbolBytes = new Uint8Array(emojis.flatMap((e) => Array.from(e.bytes)));
  const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
    symbolBytes,
  });

  const funds = fundAccountFast(aptos, registrant, ONE_APT * 100000);

  const register = EmojicoinDotFun.RegisterMarket.submit({
    aptosConfig: aptos.config,
    registrant,
    emojis: emojis.map((e) => e.hex),
    integrator: integrator.accountAddress,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    }
  });

  const [_, registerResponse] = await Promise.all([funds, register]);

  return {
    aptos,
    registerResponse,
    marketAddress,
    emojicoin,
    emojicoinLP,
    registrant,
    integrator,
    ...symbolBytesToEmojis(symbolBytes),
  };
}
