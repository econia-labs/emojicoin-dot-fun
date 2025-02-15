// cspell:word funder

import { EmojicoinArena } from "@/contract-apis";
import { type Account } from "@aptos-labs/ts-sdk";
import {
  type SymbolEmoji,
  fetchArenaRegistryView,
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { getPublisher, getAptosClient } from "../../utils";

/**
 * Have the publisher register a third market and trade on all three markets to unlock them for
 * tests. The other two markets are determined in the deployer in `src/docker/deployer/sh`.
 *
 * This facilitates beginning a new arena, since the new arena must have a new unique combination
 * of market IDs.
 *
 * This function's intended usage is in local/test environments, to be called a single time for the
 * lifetime of the local network.
 *
 * In jest, it should only be called once during the entire jest test suite, since it makes
 * assumptions about the initial state on-chain.
 *
 * @throws if called twice in the same jest test instance
 */
export const registerAndUnlockInitialMarketsForArenaTest = async () => {
  const emojicoin = new EmojicoinClient();
  const publisher = getPublisher();

  const voltageSymbol: SymbolEmoji[] = ["⚡"];
  const exists = await emojicoin.view.marketExists(voltageSymbol);
  if (exists) {
    throw new Error(`The voltage market "⚡" is reserved for initializing arena state in tests.`);
  }

  const res1 = await emojicoin.register(publisher, voltageSymbol);
  const res2 = await emojicoin.buy(publisher, voltageSymbol, 1n);

  const { res3, res4 } = await fetchArenaRegistryView().then((res) =>
    fetchArenaMeleeView(res.currentMeleeID)
      .then(fetchMeleeEmojiData)
      .then(async ({ market1, market2 }) => ({
        res3: await emojicoin.buy(publisher, market1.symbolEmojis, 1n),
        res4: await emojicoin.buy(publisher, market2.symbolEmojis, 1n),
      }))
  );

  expect([res1, res2, res3, res4].every((v) => v.response.success)).toBe(true);
};

export const waitUntilCurrentMeleeEnds = async () => {
  const arenaRegistry = await fetchArenaRegistryView();
  const melee = await fetchArenaMeleeView(arenaRegistry.currentMeleeID);

  const res = new Promise((resolve, _) => {
    const now = new Date().getTime();
    const end = Number(melee.duration / 1000n) + melee.startTime.getTime();
    if (end - now <= 0) {
      resolve(null);
    }
    const delay = Math.max(end - now + 1000, 0);
    setTimeout(() => resolve(null), delay);
  });

  return res;
};

export const ONE_MINUTE_MICROSECONDS = 60n * 1000n * 1000n;
export const ONE_SECOND_MICROSECONDS = 1000n * 1000n;

/**
 * Have the publisher set the next melee duration and end the current melee.
 *
 * Fails if the crank schedule isn't called.
 *
 * @returns the new market symbols for the next melee, the next melee view, and the next melee ID
 */
export const setNextMeleeDurationAndEnsureCrank = async (
  nextDuration: bigint = ONE_MINUTE_MICROSECONDS
) => {
  const { currentMeleeID } = await fetchArenaRegistryView();
  const melee = await fetchArenaMeleeView(currentMeleeID).then(fetchMeleeEmojiData);
  const [symbol1, symbol2] = [melee.market1.symbolEmojis, melee.market2.symbolEmojis];
  const emojicoin = new EmojicoinClient();
  const publisher = getPublisher();
  // End the first melee by cranking with `enter` and set the next melee's duration.
  await emojicoin.arena.setNextMeleeDuration(publisher, nextDuration);
  const crank = await emojicoin.arena.enter(publisher, 1n, false, symbol1, symbol2, "symbol1");
  const { currentMeleeID: newMeleeID } = await fetchArenaRegistryView();
  const newMelee = await fetchArenaMeleeView(newMeleeID).then(fetchMeleeEmojiData);
  const [newSymbol1, newSymbol2] = [newMelee.market1.symbolEmojis, newMelee.market2.symbolEmojis];
  expect(newMeleeID).toEqual(currentMeleeID + 1n);
  expect(newMelee.view.duration).toEqual(nextDuration);
  return {
    melee: newMelee,
    meleeID: newMeleeID,
    symbol1: newSymbol1,
    symbol2: newSymbol2,
    version: crank.response.version,
  };
};

/**
 * Send APT to the vault so user's entering can be matched.
 */
export const depositToVault = async (funder: Account, amount: bigint) =>
  await EmojicoinArena.FundVault.submit({
    aptosConfig: getAptosClient().config,
    funder,
    amount,
  });
