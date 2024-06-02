/* eslint-disable no-console */
/* eslint-disable import/no-unused-modules */
/* eslint-disable @typescript-eslint/no-use-before-define */

/*
 * Helper script used to generate lots of trade and chat data.
 *
 * Run with `pnpm tsx <THIS_FILE>` or `pnpm run generate-data`.
 *
 * This assumes you already have a docker instance running with the postgrest API URL at
 * the env variable `LOCAL_INBOX_URL`.
 *
 * It also implicitly uses the `START_NODE_FOR_TEST` env variable to determine whether or not to
 * start a new Aptos node for the test. This is similar to how the e2e unit tests work.
 *
 * TODO: Add liquidity provision and removal.
 * */

import {
  Account,
  type UserTransactionResponse,
  AccountAddress,
  Ed25519PrivateKey,
  APTOS_COIN,
  type Aptos,
  type TypeTag,
  type AptosConfig,
} from "@aptos-labs/ts-sdk";
import {
  getEmojicoinMarketAddressAndTypeTags,
  registerMarketAndGetEmojicoinInfo,
} from "../markets/utils";
import { getRegistryAddress, getEvents } from "../emojicoin_dot_fun";
import { getTestHelpers, publishForTest } from "../../tests/utils";
import { Chat, MarketMetadataByEmojiBytes, Swap } from "../emojicoin_dot_fun/emojicoin-dot-fun";
import { BatchTransferCoins, ExistsAt } from "../emojicoin_dot_fun/aptos-framework";
import { type Events } from "../emojicoin_dot_fun/events";
import { type EmojicoinInfo } from "../types/contract";
import { SYMBOL_DATA, getRandomEmoji } from "../emoji_data/symbol-data";
import { ONE_APT, QUOTE_VIRTUAL_FLOOR, QUOTE_VIRTUAL_CEILING, MODULE_ADDRESS } from "../const";
import { type SymbolEmojiData, getEmojiData } from "../emoji_data";
import { divideWithPrecision, sleep } from "./misc";
import { truncateAddress } from "./misc";

const NUM_TRADERS = 500;
const TRADES_PER_TRADER = 4;
const TRADERS: Array<Account> = Array.from({ length: NUM_TRADERS }, () => Account.generate());
const CHUNK_SIZE = 25;
const TRADER_INITIAL_BALANCE = ONE_APT * 1000;
const TRADER_GAS_RESERVES = ONE_APT * 0.02;
const DISTRIBUTOR_NECESSARY_BALANCE = CHUNK_SIZE * TRADER_INITIAL_BALANCE;
const NUM_DISTRIBUTORS = NUM_TRADERS / CHUNK_SIZE;
const { aptos, publisher } = getTestHelpers();

// const PUBLISHER = publisher;
const PUBLISHER = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.PUBLISHER_PK!),
});

if (!(NUM_TRADERS % CHUNK_SIZE === 0)) {
  throw new Error("NUM_TRADERS must be divisible by CHUNK_SIZE");
}

if (TRADER_INITIAL_BALANCE < TRADER_GAS_RESERVES) {
  throw new Error("TRADER_INITIAL_BALANCE must be greater than TRADER_GAS_RESERVES");
}

async function main() {
  const registryAddress = await setupTest(aptos);

  // Create distributors that will bear the sequence number for each transaction.
  const distributors = Array.from({ length: NUM_DISTRIBUTORS }).map(() => Account.generate());

  // --------------------------------------------------------------------------------------
  //                      Fund all traders and register multiple markets
  // --------------------------------------------------------------------------------------

  // Must wait for the sequence number info for `PUBLISHER` to sync.
  await fundTraders(aptos, distributors);

  // Now have the publisher register all markets sequentially.
  const numMarketsToRegister = 20;
  const markets = new Array<EmojicoinInfo & SymbolEmojiData>();
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < numMarketsToRegister; i += 1) {
    const { bytes, emoji } = getRandomEmoji();
    const res = await ensurePublisherHasRegisteredMarket({
      aptos,
      emojiBytes: bytes,
      registryAddress,
      emoji,
    }).then((r) => {
      console.log(`Registered market at ${r.marketAddress} for emoji: ${emoji}`);
      return {
        ...r,
        ...getEmojiData(emoji)!,
      };
    });
    markets.push(res);
  }
  console.log(`Registered ${numMarketsToRegister} markets!`);

  // --------------------------------------------------------------------------------------
  //                  Have all traders submit N trades and N chat messages
  //                             where N = TRADES_PER_TRADER
  // --------------------------------------------------------------------------------------

  const allTradeResults = Array<Promise<[UserTransactionResponse, Events][]>>();
  for (let i = 0; i <= NUM_TRADERS / CHUNK_SIZE; i += 1) {
    await sleep(2000);
    console.log(`-----------------------------------BATCH ${i}-----------------------------------`);
    const tradersChunk = TRADERS.slice(CHUNK_SIZE * i, (i + 1) * CHUNK_SIZE);
    const trades = tradersChunk.map((t) => {
      // Save 2% of the balance for gas fees.
      const totalTradedAmount = BigInt((TRADER_INITIAL_BALANCE - TRADER_GAS_RESERVES) * 0.95); // 5% buffer.
      const amounts = generateRandomTrades({
        numTrades: TRADES_PER_TRADER,
        totalTradeAmount: totalTradedAmount,
      });
      const market = markets[Math.floor(Math.random() * markets.length)];

      // In case we ever want to loop this entire loop, you could fetch the user's sequence number
      // here instead of assuming it's 0.
      const sequenceNumber = 0;
      const results = amounts.map(async (amt, ii) => {
        try {
          await sleep(Math.random() * 1000 + 1000);
          const { swap, chat } = await submitTradeAndRandomChatMessage({
            aptosConfig: aptos.config,
            sequenceNumber: sequenceNumber + ii * 2,
            marketAddress: market.marketAddress,
            typeTags: [market.emojicoin, market.emojicoinLP],
            user: t,
            tradeInputs: {
              inputAmount: amt,
              integrator: PUBLISHER.accountAddress,
              integratorFeeRateBps: 0,
            },
          });

          return await swap
            .then(async (res) => {
              try {
                const chatEvents = (await chat).events;
                res.events.push(...chatEvents);
              } catch (e) {
                console.dir(
                  { s: t.accountAddress.toString(), m: "failed to submit chat message", err: e },
                  { depth: 3 }
                );
              }
              const events = getEvents(res);
              return [res, events];
            })
            .catch((e) => {
              console.dir(
                { s: t.accountAddress.toString(), m: "failed to submit trade", err: e },
                { depth: 3 }
              );
              return undefined;
            });
        } catch (e) {
          return undefined;
        }
      });
      return Promise.all(results);
    });

    const tradeResults = Promise.all(trades).then((res) => {
      const curated = res
        .flat()
        .filter((v): v is [UserTransactionResponse, Events] => typeof v !== "undefined");
      curated.sort((tx_a, tx_b) => {
        const a = Number(tx_a[0].version);
        const b = Number(tx_b[0].version);
        return a - b;
      });
      printTradeResults(curated);
      return curated;
    });
    allTradeResults.push(tradeResults);
  }
  const res = await Promise.all(allTradeResults);
  console.log("All trades and chats submitted! Total # trades: ", res.flat().length);
  // --------------------------------------------
  //           Finish trade and chats
  // --------------------------------------------
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

  try {
    const safeFundAmount = 1000000 * ONE_APT;
    await aptos.fundAccount({
      accountAddress: PUBLISHER.accountAddress,
      amount: Number(safeFundAmount),
    });
    console.log(`Funded publisher account with ${safeFundAmount} APT`);
  } catch (e) {
    console.error(e);
    console.error("Failed to fund publisher. Is the Aptos framework using a custom mint function?");
  }

  try {
    return await getRegistryAddress({ aptos, moduleAddress: MODULE_ADDRESS });
  } catch (e) {
    // Not published yet, let's publish.
    await publishForTest(PUBLISHER.privateKey.toString());
    return await getRegistryAddress({ aptos, moduleAddress: MODULE_ADDRESS });
  }
};

const ensurePublisherHasRegisteredMarket = async ({
  aptos,
  emojiBytes,
  registryAddress,
  emoji,
}: {
  aptos: Aptos;
  emojiBytes: Uint8Array;
  registryAddress: AccountAddress;
  emoji: string;
}): Promise<EmojicoinInfo> => {
  const emojicoinInfo = await MarketMetadataByEmojiBytes.view({
    aptos,
    emojiBytes,
  }).then((res) => {
    if (res.vec.pop()) {
      console.log(`Market already exists for emoji: ${emoji}`);
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

const submitTradeAndRandomChatMessage = async (args: {
  aptosConfig: AptosConfig;
  sequenceNumber: number;
  marketAddress: AccountAddress;
  typeTags: [TypeTag, TypeTag];
  user: Account;
  tradeInputs: {
    inputAmount: bigint;
    integrator: AccountAddress;
    integratorFeeRateBps: number;
  };
}) => {
  const sharedArgs = {
    aptosConfig: args.aptosConfig,
    marketAddress: args.marketAddress,
    typeTags: args.typeTags,
    waitForTransactionOptions: {
      checkSuccess: false,
      waitForIndexer: false,
      timeoutSecs: 60,
    },
  };
  const amt = args.tradeInputs.inputAmount;
  const swap = Swap.submit({
    ...sharedArgs,
    swapper: args.user,
    inputAmount: amt < 0n ? -10000n * amt : amt,
    isSell: amt < 0n,
    integrator: PUBLISHER.accountAddress,
    integratorFeeRateBps: 0,
    options: {
      accountSequenceNumber: args.sequenceNumber,
      maxGasAmount: TRADER_GAS_RESERVES / 100,
      gasUnitPrice: 100,
    },
  });

  await sleep(Math.random() * 1000 + 1000);

  const chat = Chat.submit({
    ...sharedArgs,
    ...generateRandomChatMessage({}),
    user: args.user,
    options: {
      accountSequenceNumber: args.sequenceNumber + 1,
      maxGasAmount: TRADER_GAS_RESERVES / 100,
      gasUnitPrice: 100,
    },
  });

  return {
    swap,
    chat,
  };
};

const generateRandomTrades = ({
  numTrades,
  totalTradeAmount,
}: {
  numTrades: number;
  totalTradeAmount: bigint;
}): bigint[] => {
  if (numTrades % 2 !== 0 && numTrades !== 1) {
    throw new Error("`numTrades` must be an even number to ensure paired buy/sell trades.");
  }

  const trades: bigint[] = Array.from({ length: numTrades });
  let remainingPercentage = 100;
  const buyPercentages: number[] = [];

  // Generate random buy percentages that sum up to 100.
  for (let i = 0; i < numTrades / 2; i += 1) {
    const maxPercentage = remainingPercentage - (numTrades / 2 - i - 1);
    const buyPercentage = Math.random() * (maxPercentage - 1) + 1;
    buyPercentages.push(buyPercentage);
    remainingPercentage -= buyPercentage;
  }

  // Adjust the last buy percentage to exactly sum to 100.
  buyPercentages[buyPercentages.length - 1] += remainingPercentage;

  // Create buy trades.
  for (let i = 0; i < buyPercentages.length; i += 1) {
    trades[i * 2] = (totalTradeAmount * BigInt(Math.floor(buyPercentages[i]))) / 100n;
    const isSellMultiplier = Math.random() > 0.5 ? 1n : -1n;
    // The sell % is the % of the previous buy.
    const sellPercentage = Math.floor(Math.random() * 50);
    trades[i * 2 + 1] = BigInt(sellPercentage) * trades[i * 2] * isSellMultiplier;
  }

  return trades;
};

const generateRandomChatMessage = ({
  uniqueEmojis = 5,
  messageLength = 10,
}: {
  uniqueEmojis?: number;
  messageLength?: number;
}): {
  emojiBytes: Uint8Array[];
  emojiIndicesSequence: Uint8Array;
} => {
  if (uniqueEmojis < 1 || messageLength < 1) {
    throw new Error("Can't send an empty chat message!");
  }

  const chatEmojiBytes = Array.from({ length: uniqueEmojis }).map(() => getRandomEmoji().bytes);

  const indices = Array.from({ length: messageLength }).map(() =>
    Math.floor(Math.random() * chatEmojiBytes.length)
  );

  return {
    emojiBytes: chatEmojiBytes,
    emojiIndicesSequence: new Uint8Array(indices),
  };
};

const printTradeResults = (tradeResults: Array<[UserTransactionResponse, Events]>) => {
  tradeResults.forEach((tx) => {
    const [res, events] = tx;
    const eventNum = Math.floor(Number(res.sequence_number) / 2);
    const state = events.stateEvents[0] ? events.stateEvents[0] : null;
    const swap = events.swapEvents[0] ? events.swapEvents[0] : null;
    if (state && swap) {
      const emoji = SYMBOL_DATA.byHex(state.marketMetadata.emojiBytes)!.emoji;
      const aptSpent = divideWithPrecision({
        a: state.clammVirtualReserves.quote - QUOTE_VIRTUAL_FLOOR,
        b: ONE_APT,
        decimals: 3,
      }).toFixed(3);
      const quoteLeftBeforeTransition = divideWithPrecision({
        a: QUOTE_VIRTUAL_CEILING - state.clammVirtualReserves.quote,
        b: BigInt(ONE_APT),
        decimals: 3,
      }).toFixed(3);
      const input = divideWithPrecision({
        a: swap.inputAmount * (swap.isSell ? -1n : 1n),
        b: BigInt(ONE_APT),
        decimals: 1,
      }).toFixed(3);
      const lastPrice = divideWithPrecision({
        a: 1,
        b: state.lastSwap.avgExecutionPrice,
        decimals: 10,
      });
      const buyOrSellText = swap.isSell ? `📉 -${input} ${emoji}` : `📈 +${input} APT at an avg`;
      const lastPriceText = `price of ${lastPrice / 10} APT/${emoji}`;
      const spendOnBondingCurve = `${buyOrSellText} ${lastPriceText} ${input} ${aptSpent} APT in bonding curve.`;
      const quoteLeft = `${quoteLeftBeforeTransition} to go before we transition into CPAMM!`;
      const s =
        `tx[${res.version}] Trade #${eventNum} for ${truncateAddress(swap.swapper)} completed for` +
        `emoji market: ${emoji} with market ID: ${state.marketMetadata.marketID}` +
        `${
          !swap.resultsInStateTransition
            ? `${spendOnBondingCurve} ${quoteLeft}`
            : "We're already in the CPAMM!"
        }`;
      console.debug(s);
    }
    const chat = events.chatEvents[0] ? events.chatEvents[0] : null;
    if (chat) {
      const emoji = SYMBOL_DATA.byHex(chat.marketMetadata.emojiBytes)!.emoji;
      const balAsFraction = divideWithPrecision({
        a: chat.userEmojicoinBalance,
        b: chat.circulatingSupply,
        decimals: 2,
      });
      const s =
        `tx[${res.version}] Chat message sent from ${truncateAddress(chat.user)} for emoji market: ${emoji}` +
        ` with market ID: ${chat.marketMetadata.marketID}` +
        ` User owns ${balAsFraction}%` +
        ` of the circulating supply: ${chat.circulatingSupply}. User says "${chat.message}"`;

      console.debug(s);
    }
    const outOfBondingCurve = events.swapEvents.some((event) => event.resultsInStateTransition);

    if (outOfBondingCurve) {
      console.log(
        `${res.sender.toString()} moved the market out of the bonding curve! Tx hash: ${res.hash}`
      );
    }
  });
};

main().then(() => console.log("\nDone!"));
