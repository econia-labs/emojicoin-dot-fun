import {
  Account,
  Ed25519Account,
  Ed25519PrivateKey,
  Hex,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";
import findGitRoot from "find-git-root";
import { getAptosClient } from "./aptos-client";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets/utils";
import { EmojicoinDotFun, getEvents } from "../../src/emojicoin_dot_fun";
import {
  type EmojiName,
  generateRandomSymbol,
  type JSONTypes,
  type MarketEmojiData,
  ONE_APT,
  SYMBOL_DATA,
  toMarketEmojiData,
  type Types,
} from "../../src";
import { type Events } from "../../src/emojicoin_dot_fun/events";
import { type PublishHelpers } from "./types";

// The exact amount of APT to trigger a transition out of the bonding curve. Note that the
// fee integrator rate BPs must be set to 0 for this to work.
export const EXACT_TRANSITION_INPUT_AMOUNT = 100_000_000_000n;

export const TS_UNIT_TEST_DIR = path.join(getGitRoot(), "src/typescript/sdk/tests");
export const PUBLISHER_PRIVATE_KEY_PATH = path.resolve(
  path.join(TS_UNIT_TEST_DIR, ".tmp", ".publisher_private_key")
);
export const PUBLISH_RES_PATH = path.resolve(
  path.join(TS_UNIT_TEST_DIR, ".tmp", ".publish_result")
);
export const TEST_LOGS_PATH = path.resolve(path.join(TS_UNIT_TEST_DIR, ".tmp", "logs"));

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
export function getPublishHelpers(): PublishHelpers {
  const { aptos } = getAptosClient();

  const privateKeyString = fs.readFileSync(PUBLISHER_PRIVATE_KEY_PATH).toString();
  const publisher = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(Hex.fromHexString(privateKeyString).toUint8Array()),
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

type RegisterMarketHelper = Types.EmojicoinInfo &
  MarketEmojiData & {
    registrant: Account;
    integrator: Account;
    registerResponse: UserTransactionResponse | undefined;
    events: Events;
  };

async function registerMarketFromNames(args: {
  registrant: Account;
  emojiNames: Array<EmojiName>;
  integrator?: Account;
}): Promise<RegisterMarketHelper & { registerResponse: UserTransactionResponse }> {
  const { aptos } = getPublishHelpers();
  const { registrant, emojiNames, integrator = registrant } = args;
  const symbolBytes = new Uint8Array(
    emojiNames.flatMap((e) => Array.from(SYMBOL_DATA.byStrictName(e).bytes))
  );
  const symbol = toMarketEmojiData(symbolBytes);

  const response = await EmojicoinDotFun.RegisterMarket.submit({
    aptosConfig: aptos.config,
    registrant: args.registrant,
    emojis: symbol.emojis.map((e) => e.hex),
    integrator: integrator.accountAddress,
    options: {
      maxGasAmount: ONE_APT / 100,
      gasUnitPrice: 100,
    },
  });

  expect(response.success).toBe(true);

  return {
    ...getEmojicoinMarketAddressAndTypeTags({ symbolBytes }),
    registrant,
    integrator,
    registerResponse: response,
    ...symbol,
    events: getEvents(response),
  };
}

async function registerRandomMarket({
  registrant = Ed25519Account.generate(),
  integrator = Ed25519Account.generate(),
}: {
  registrant?: Account;
  additionalAccountsToFund?: Array<Account>;
  integrator?: Account;
}): Promise<RegisterMarketHelper> {
  const { aptos } = getPublishHelpers();

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

  // Default the `success` field to true, because we don't want to throw an error if the
  // market is already registered, we just want to make sure it exists.
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
      },
    });

    expect(registerResponse.success).toBe(true);
  }

  return {
    registerResponse,
    marketAddress,
    emojicoin,
    emojicoinLP,
    registrant,
    integrator,
    ...symbol,
    events: getEvents(registerResponse),
  };
}

// So as not to pollute the global scope, we export the test helpers as a single object.
const TestHelpers = {
  registerMarketFromNames,
  registerRandomMarket,
};

export default TestHelpers;
