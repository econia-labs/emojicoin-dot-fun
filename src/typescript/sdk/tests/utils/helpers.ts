import { Account, Ed25519PrivateKey, Hex, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import findGitRoot from "find-git-root";
import { getAptosClient } from "./aptos-client";
import { type TestHelpers } from "./types";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets/utils";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { generateRandomSymbol, type JSONTypes, ONE_APT } from "../../src";

// The exact amount of APT to trigger a transition out of the bonding curve. Note that the
// fee integrator rate BPs must be set to 0 for this to work.
export const EXACT_TRANSITION_INPUT_AMOUNT = 100_000_000_000n;

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
  registrant = Account.generate(),
  integrator = Account.generate(),
  sequenceNumber,
}: {
  registrant?: Account;
  additionalAccountsToFund?: Array<Account>;
  integrator?: Account;
  sequenceNumber?: bigint;
}) {
  const { aptos } = getTestHelpers();

  let symbol = generateRandomSymbol();
  let registered = true as boolean | JSONTypes.MarketMetadata | undefined;
  while (registered) {
    /* eslint-disable-next-line no-await-in-loop */
    registered = await EmojicoinDotFun.MarketMetadataByEmojiBytes.view({
      aptos,
      emojiBytes: symbol.symbolData.bytes,
    }).then((r) => r.vec.at(0));
    if (!registered) {
      break;
    }
    symbol = generateRandomSymbol();
  }

  const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
    symbolBytes: symbol.symbolData.bytes,
  });

  let registerResponse: UserTransactionResponse | undefined;
  if (!registered) {
    registerResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis: symbol.emojis.map((e) => e.hex),
      integrator: integrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
        accountSequenceNumber: sequenceNumber,
      },
    });
  }

  return {
    registerResponse,
    marketAddress,
    emojicoin,
    emojicoinLP,
    registrant,
    integrator,
    ...symbol,
  };
}
