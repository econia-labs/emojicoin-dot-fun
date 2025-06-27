/* eslint-disable no-console */
// cspell:word kolorist

import type { Account } from "@aptos-labs/ts-sdk";
import { type fetchAllCurrentMeleeData, sleep } from "@econia-labs/emojicoin-sdk";
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";
import { gray, yellow } from "kolorist";
import { getAccountPrefix } from "src/test-exports";

type Melee = Awaited<ReturnType<typeof fetchAllCurrentMeleeData>>;

interface MakeRandomTrades {
  emojicoin?: EmojicoinClient;
  melee: Melee;
  account: Account;
  lockIn?: boolean;
  inputAmounts: bigint[];
  accountID?: string;
  enterSymbolIndex?: 0 | 1;
  numTrades?: number;
}

/**
 * Makes random trades for an account in the current arena.
 *
 * Note this function is not robust- it does not handle re-entering or melees ending in the
 * middle of the script.
 *
 * It is primarily just to send off a bunch of transactions to generate arena data.
 */
export const makeRandomTrades = async ({
  emojicoin = new EmojicoinClient(),
  melee,
  account,
  lockIn = false,
  inputAmounts,
  accountID = getAccountPrefix(account),
  enterSymbolIndex = Math.random() <= 0.5 ? 0 : 1,
  numTrades = 100,
}: MakeRandomTrades) => {
  const [symbol0, symbol1] = [melee.market0.symbolEmojis, melee.market1.symbolEmojis];
  const coins = [symbol0, symbol1];
  const currentCoinIndex = enterSymbolIndex;
  const coloredID = gray(accountID);

  try {
    // Initial sleep to offset each account.
    await sleep(Number(accountID) * 100);

    const inputAmount = inputAmounts.pop();
    if (inputAmount === undefined) throw new Error("Not enough input amounts to use.");
    await emojicoin.arena
      .enter(
        account,
        inputAmount,
        lockIn,
        symbol0,
        symbol1,
        currentCoinIndex === 0 ? "symbol0" : "symbol1"
      )
      .then(() => {
        console.info(`${accountID} has entered!`);
      });

    let i = 0;
    while (i < numTrades) {
      const baseSleep = i * 200;
      const randomizedSleep = Math.random() * 30 * 100;
      await sleep(baseSleep + randomizedSleep);
      await emojicoin.arena.swap(account, symbol0, symbol1);
      const fromCoin = coins[(currentCoinIndex + i) % 2].join("");
      const toCoin = coins[(currentCoinIndex + (i + 1)) % 2].join("");
      console.info(`${accountID} has swapped from ${fromCoin} to ${toCoin}, trade ${yellow(i)}`);
      i += 1;
    }

    await emojicoin.arena.exit(account, symbol0, symbol1);
    console.info(`${coloredID} has exited!`);
  } catch (e) {
    if ((e as any).message.includes("E_SWAP_NO_FUNDS")) {
      console.log(`${accountID} ran out of money...`);
      return;
    }
    throw e;
  }
};
