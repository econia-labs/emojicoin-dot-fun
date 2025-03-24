import { Account, Ed25519PrivateKey, Hex, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import path from "path";
import findGitRoot from "find-git-root";
import { getAptosClient } from "../../src/utils/aptos-client";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets/utils";
import { EmojicoinDotFun, getEvents } from "../../src/emojicoin_dot_fun";
import {
  type MarketEmojiData,
  ONE_APT,
  SYMBOL_EMOJI_DATA,
  type SymbolEmoji,
  type SymbolEmojiName,
  toMarketEmojiData,
  type Types,
} from "../../src";
import { type Events } from "../../src/emojicoin_dot_fun/events";
import { type XOR } from "../../src/utils/utility-types";

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

export const getPublisher = () => Account.fromPrivateKey({ privateKey: getPublisherPrivateKey() });

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

  return {
    aptos: getAptosClient(),
    publisher: getPublisher(),
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

const bytesFromNameOrEmoji = (nameOrEmoji: SymbolEmojiName | SymbolEmoji) => {
  if (SYMBOL_EMOJI_DATA.hasName(nameOrEmoji)) {
    return Array.from(SYMBOL_EMOJI_DATA.byName(nameOrEmoji)!.bytes);
  }
  if (SYMBOL_EMOJI_DATA.hasEmoji(nameOrEmoji)) {
    return Array.from(SYMBOL_EMOJI_DATA.byEmoji(nameOrEmoji)!.bytes);
  }
  throw new Error(`Invalid name or emoji passed: ${nameOrEmoji}`);
};

export async function registerMarketHelper(
  args: {
    registrant: Account;
    integrator?: Account;
  } & XOR<{ emojis: SymbolEmoji[] }, { emojiNames: SymbolEmojiName[] }>
): Promise<RegisterMarketHelper & { registerResponse: UserTransactionResponse }> {
  const { aptos } = getPublishHelpers();
  const { registrant, emojis, emojiNames, integrator = registrant } = args;
  const symbolBytes = new Uint8Array((emojis ?? emojiNames).flatMap(bytesFromNameOrEmoji));
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
