/* eslint-disable no-console */
/* eslint-disable import/no-unused-modules */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Account,
  type UserTransactionResponse,
  AccountAddress,
  Ed25519PrivateKey,
  APTOS_COIN,
  type Aptos,
} from "@aptos-labs/ts-sdk";
import { TextDecoder } from "util";
import {
  divideWithPrecision,
  getEmojicoinMarketAddressAndTypeTags,
  registerMarketAndGetEmojicoinInfo,
  truncateAddress,
} from "./utils";
import {
  ONE_APT,
  QUOTE_VIRTUAL_CEILING,
  getRegistryAddress,
  getEvents,
  QUOTE_VIRTUAL_FLOOR,
} from "../emojicoin_dot_fun";
import { getTestHelpers, publishForTest } from "../../tests/utils";
import {
  MarketMetadataByEmojiBytes,
  MarketView,
  Swap,
} from "../emojicoin_dot_fun/emojicoin-dot-fun";
import { BatchTransferCoins, ExistsAt, Mint } from "../emojicoin_dot_fun/aptos-framework";
import { type Events } from "../emojicoin_dot_fun/events";
import { type EmojicoinInfo } from "../types/contract";
import { getRandomEmoji } from "../emoji_data/utils";

const NUM_TRADERS = 500;
const TRADERS: Array<Account> = Array.from({ length: NUM_TRADERS }, () => Account.generate());
const CHUNK_SIZE = 50;
const TRADER_INITIAL_BALANCE = ONE_APT * 10;
const DISTRIBUTOR_NECESSARY_BALANCE = CHUNK_SIZE * TRADER_INITIAL_BALANCE;
const MAX_U64 = 18446744073709551615n;
const NUM_DISTRIBUTORS = NUM_TRADERS / CHUNK_SIZE;
const MODULE_ADDRESS = AccountAddress.from(process.env.MODULE_ADDRESS!);
const PUBLISHER = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PUBLISHER_PK!),
});

async function trade() {
  const { emoji: asActualEmoji, bytes: emojiBytes } = getRandomEmoji();
  const { aptos } = getTestHelpers();
  const registryAddress = await setupTest(aptos);

  // Create distributors that will bear the sequence number for each transaction.
  const distributors = Array.from({ length: NUM_DISTRIBUTORS }).map(() => Account.generate());

  await fundTraders(aptos, distributors);
  const { marketAddress, emojicoin, emojicoinLP } = await getOrRegisterMarket({
    aptos,
    emojiBytes,
    registryAddress,
    asActualEmoji,
  });

  console.log(`Market address: ${marketAddress}`);
  console.log(`Emojicoin TypeTag: ${emojicoin.toString()}`);
  console.log(`EmojicoinLP TypeTag: ${emojicoinLP.toString()}`);

  // Each trade is a buy for some amount between 50% and 100% of their APT balance.
  const amount = Math.floor(TRADER_INITIAL_BALANCE * (0.5 + Math.random() * 0.5));
  // All buys.
  const isSell = false;

  // Await each chunk of traders trading.
  for (let i = 0; i <= NUM_TRADERS / CHUNK_SIZE; i += 1) {
    console.log(`-----------------------------------BATCH ${i}-----------------------------------`);
    const tradersChunk = TRADERS.slice(CHUNK_SIZE * i, (i + 1) * CHUNK_SIZE);
    const trades = tradersChunk.map((t) => {
      try {
        const randIdx = Math.floor(Math.random() * distributors.length);

        const swap = Swap.submit({
          aptosConfig: aptos.config,
          marketAddress,
          swapper: t,
          inputAmount: amount,
          isSell,
          integrator: PUBLISHER.accountAddress,
          integratorFeeRateBps: 0,
          typeTags: [emojicoin, emojicoinLP],
          feePayer: distributors[randIdx],
          waitForTransactionOptions: {
            checkSuccess: true,
            waitForIndexer: false,
            timeoutSecs: 20,
          },
        });
        return swap.then((res) => {
          const events = getEvents(res);
          return [res, events];
        });
      } catch (e) {
        return undefined;
      }
    });

    /* eslint-disable-next-line no-await-in-loop */
    const tradeResults = (await Promise.all(trades))
      .filter((v): v is [UserTransactionResponse, Events] => typeof v !== "undefined")
      .sort((tx_a, tx_b) => {
        const a = Number(tx_a[0].version);
        const b = Number(tx_b[0].version);
        return a - b;
      });

    tradeResults.forEach((tx) => {
      const [res, events] = tx;
      const state = events.stateEvents[0] ? events.stateEvents[0] : null;
      const swap = events.swapEvents[0] ? events.swapEvents[0] : null;
      if (state && swap) {
        const textDecoder = new TextDecoder("utf-8");
        const emoji = textDecoder.decode(state.market_metadata.emoji_bytes);
        const aptSpent = divideWithPrecision({
          a: state.clamm_virtual_reserves.quote - QUOTE_VIRTUAL_FLOOR,
          b: ONE_APT,
          decimals: 3,
        }).toFixed(3);
        const quoteLeftBeforeTransition = divideWithPrecision({
          a: QUOTE_VIRTUAL_CEILING - state.clamm_virtual_reserves.quote,
          b: BigInt(ONE_APT),
          decimals: 3,
        }).toFixed(3);
        const spendOnBondingCurve = `${aptSpent} APT spent on bonding curve.`;
        const quoteLeft = `${quoteLeftBeforeTransition} to go before the bonding curve ends!`;
        const s =
          `Trade for ${swap.swapper.toString()} completed for emoji market: ${emoji}` +
          ` with market ID: ${state.market_metadata.market_id}` +
          ` at version: ${Number(res.version)}. ${
            !swap.results_in_state_transition
              ? `${spendOnBondingCurve} ${quoteLeft}`
              : "We're already in the CPAMM!"
          }`;
        console.debug(s);
      }
      const outOfBondingCurve = events.swapEvents.some(
        (event) => event.results_in_state_transition
      );

      if (outOfBondingCurve) {
        console.log(
          `${res.sender.toString()} moved the market out of the bonding curve! Tx hash: ${res.hash}`
        );
      }
    });
  }

  // View the current state of the market after all trades.
  const res = await MarketView.view({
    aptos,
    marketAddress,
    typeTags: [emojicoin, emojicoinLP],
  });
  console.log("Market data:");
  console.log(res);
}

// --------------------------------------------------------------------------------------
//                              Setup and helper functions
// --------------------------------------------------------------------------------------

const setupTest = async (aptos: Aptos): Promise<AccountAddress> => {
  // Fund the publisher account if it doesn't exist yet.
  const fundIfExists = ExistsAt.view({ aptos, addr: PUBLISHER.accountAddress }).then((exists) => {
    if (!exists) {
      console.log("Publisher account doesn't exist yet. Funding...");
      return aptos.fundAccount({ accountAddress: PUBLISHER.accountAddress, amount: ONE_APT });
    }
    return null;
  });
  await fundIfExists;

  // Fund the publisher account with a large amount of APT.
  const publisherBalance = await aptos.account.getAccountAPTAmount({
    accountAddress: PUBLISHER.accountAddress,
  });

  const maxFundAmount = MAX_U64 - BigInt(publisherBalance);
  if (maxFundAmount > 0) {
    try {
      await Mint.submit({
        aptosConfig: aptos.config,
        account: PUBLISHER,
        dstAddr: PUBLISHER.accountAddress,
        amount: maxFundAmount,
      });
      console.log("Funded publisher account.");
    } catch (e) {
      console.error(e);
      console.error(
        "Failed to fund publisher. Is the Aptos framework using a custom mint function?"
      );
    }
  }

  try {
    return await getRegistryAddress({ aptos, moduleAddress: MODULE_ADDRESS });
  } catch (e) {
    // Not published yet, let's publish.
    await publishForTest(PUBLISHER.privateKey.toString());
    return await getRegistryAddress({ aptos, moduleAddress: MODULE_ADDRESS });
  }
};

const getOrRegisterMarket = async ({
  aptos,
  emojiBytes,
  registryAddress,
  asActualEmoji,
}: {
  aptos: Aptos;
  emojiBytes: Uint8Array;
  registryAddress: AccountAddress;
  asActualEmoji: string;
}): Promise<EmojicoinInfo> => {
  const emojicoinInfo = await MarketMetadataByEmojiBytes.view({
    aptos,
    emojiBytes,
  }).then((res) => {
    if (res.vec.pop()) {
      console.log(`Market already exists for emoji: ${asActualEmoji}`);
      return getEmojicoinMarketAddressAndTypeTags({
        registryAddress,
        symbolBytes: emojiBytes,
      });
    }
    return registerMarketAndGetEmojicoinInfo({
      aptos,
      registryAddress,
      emojis: [emojiBytes],
      sender: PUBLISHER,
      integrator: PUBLISHER.accountAddress,
    });
  });

  return emojicoinInfo;
};

const fundTraders = async (aptos: Aptos, distributors: Account[]) => {
  await BatchTransferCoins.submit({
    aptosConfig: aptos.config,
    from: PUBLISHER,
    recipients: distributors.map((d) => d.accountAddress),
    amounts: distributors.map((_) => BigInt(DISTRIBUTOR_NECESSARY_BALANCE + ONE_APT)),
    typeTags: [APTOS_COIN],
  }).then((res) => console.log("Distributed coins to distributors. tx version:", res.version));

  const fundTraderResults: Array<Promise<UserTransactionResponse>> = [];
  for (let i = 0; i < NUM_TRADERS / CHUNK_SIZE; i += 1) {
    const chunk = TRADERS.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const res = BatchTransferCoins.submit({
      aptosConfig: aptos.config,
      from: distributors[i],
      recipients: chunk.map((t) => t.accountAddress),
      amounts: chunk.map((_) => BigInt(TRADER_INITIAL_BALANCE)),
      feePayer: distributors[i],
      typeTags: [APTOS_COIN],
    });

    const addr = truncateAddress(distributors[i].accountAddress.toString());

    console.log(`Funding ${CHUNK_SIZE} traders with distributor[${i}]... => ${addr}`);
    res.then((r) => console.log(`Funding complete! version: ${r.version}: ${i}`));
    fundTraderResults.push(res);
  }

  const res = await Promise.all(fundTraderResults);
  console.log(`Distributed coins to all ${TRADERS.length} traders`);

  return res;
};

trade();
