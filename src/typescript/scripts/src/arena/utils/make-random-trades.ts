/* eslint-disable no-console */
// cspell:word kolorist

import { type Account } from "@aptos-labs/ts-sdk";
import { ONE_APT, sleep, type fetchAllCurrentMeleeData } from "@econia-labs/emojicoin-sdk";
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";
import { gray, yellow } from "kolorist";
import { getAccountPrefix } from "src/test-exports";

type Melee = Awaited<ReturnType<typeof fetchAllCurrentMeleeData>>;

const upToOneApt = () => BigInt(Math.floor(Math.random() * ONE_APT * 10));

interface MakeRandomTrades {
  emojicoin?: EmojicoinClient;
  melee: Melee;
  account: Account;
  lockIn?: boolean;
  inputAmount?: bigint;
  accountID?: string;
  enterSymbolIndex?: 0 | 1;
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
  inputAmount = upToOneApt(),
  accountID = getAccountPrefix(account),
  enterSymbolIndex = Math.random() <= 0.5 ? 0 : 1,
}: MakeRandomTrades) => {
  const [symbol0, symbol1] = [melee.market1.symbolEmojis, melee.market2.symbolEmojis];
  const coins = [symbol0, symbol1];
  const currentCoinIndex = enterSymbolIndex;
  const coloredID = gray(accountID);

  try {
    // Initial sleep to offset each account.
    await sleep(Number(accountID) * 100);

    await emojicoin.arena
      .enter(
        account,
        inputAmount,
        lockIn,
        symbol0,
        symbol1,
        currentCoinIndex === 0 ? "symbol1" : "symbol2"
      )
      .then(() => {
        console.info(`${accountID} has entered!`);
      });

    let i = 0;
    while (i < 100) {
      const baseSleep = i * 200;
      const randomizedSleep = Math.random() * 30 * 1000;
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
