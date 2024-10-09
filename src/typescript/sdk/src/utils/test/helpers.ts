import {
  Account,
  Ed25519Account,
  Ed25519PrivateKey,
  Hex,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import path from "path";
import findGitRoot from "find-git-root";
import { getAptosClient } from "../../utils/aptos-client";
import { getEmojicoinMarketAddressAndTypeTags } from "../../markets/utils";
import { EmojicoinDotFun, getEvents } from "../../emojicoin_dot_fun";
import {
  type EmojiName,
  generateRandomSymbol,
  type JsonTypes,
  type MarketEmojiData,
  ONE_APT,
  SYMBOL_DATA,
  type SymbolEmoji,
  toMarketEmojiData,
  type Types,
} from "../..";
import { type Events } from "../../emojicoin_dot_fun/events";

// The exact amount of APT to trigger a transition out of the bonding curve. Note that the
// fee integrator rate BPs must be set to 0 for this to work.
export const EXACT_TRANSITION_INPUT_AMOUNT = 100_000_000_000n;

export const getPublisherPrivateKey = () => {
  if (!process.env.PUBLISHER_PRIVATE_KEY) {
    throw new Error("process.env.PUBLISHER_PRIVATE_KEY must be set.");
  }
  const privateKeyString = process.env.PUBLISHER_PRIVATE_KEY;
  const privateKey = new Ed25519PrivateKey(Hex.fromHexString(privateKeyString).toUint8Array());
  return privateKey;
};

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
export function getPublishHelpers() {
  if (process.env.NEXT_PUBLIC_APTOS_NETWORK !== "local") {
    throw new Error(
      "This function should only be called within the context of a local network environment."
    );
  }

  const { aptos } = getAptosClient();

  const privateKeyString = process.env.PUBLISHER_PRIVATE_KEY;
  if (!privateKeyString) {
    throw new Error("process.env.PUBLISHER_PRIVATE_KEY must be set.");
  }
  const privateKey = getPublisherPrivateKey();
  const publisher = Account.fromPrivateKey({ privateKey });

  return {
    aptos,
    publisher,
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

type RegisterMarketHelper = Types["EmojicoinInfo"] &
  MarketEmojiData & {
    registrant: Account;
    integrator: Account;
    registerResponse: UserTransactionResponse | undefined;
    events: Events;
  };

const bytesFromNameOrEmoji = (nameOrEmoji: EmojiName | SymbolEmoji) => {
  if (SYMBOL_DATA.hasName(nameOrEmoji)) {
    return Array.from(SYMBOL_DATA.byName(nameOrEmoji)!.bytes);
  }
  if (SYMBOL_DATA.hasEmoji(nameOrEmoji)) {
    return Array.from(SYMBOL_DATA.byEmoji(nameOrEmoji)!.bytes);
  }
  throw new Error(`Invalid name or emoji passed: ${nameOrEmoji}`);
};

async function registerMarketFromEmojis(args: {
  registrant: Account;
  emojis: Array<SymbolEmoji>;
  integrator?: Account;
}) {
  return registerMarketFromEmojisOrNames({ ...args, inputs: args.emojis });
}

async function registerMarketFromNames(args: {
  registrant: Account;
  emojiNames: Array<EmojiName>;
  integrator?: Account;
}) {
  return registerMarketFromEmojisOrNames({ ...args, inputs: args.emojiNames });
}

async function registerMarketFromEmojisOrNames(args: {
  registrant: Account;
  inputs: Array<EmojiName>;
  integrator?: Account;
}): Promise<RegisterMarketHelper & { registerResponse: UserTransactionResponse }> {
  const { aptos } = getPublishHelpers();
  const { registrant, inputs, integrator = registrant } = args;
  const symbolBytes = new Uint8Array(inputs.flatMap(bytesFromNameOrEmoji));
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
  let registered = true as boolean | JsonTypes["MarketMetadata"] | undefined;
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
  registerMarketFromEmojis,
  registerRandomMarket,
};

export default TestHelpers;
