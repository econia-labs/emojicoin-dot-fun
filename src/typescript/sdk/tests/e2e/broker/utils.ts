// cspell:word funder

import {
  type AnyNumberString,
  EmojicoinArena,
  getAptosClient,
  type SymbolEmoji,
  waitFor,
} from "../../../src";
import {
  type BrokerEvent,
  type BrokerMessage,
  brokerMessageConverter,
  type SubscribableBrokerEvents,
  type SubscriptionMessage,
} from "../../../src/broker-v2/types";
import { type BrokerJsonTypes } from "../../../src/indexer-v2/types/json-types";
import { parseJSONWithBigInts } from "../../../src/indexer-v2/json-bigint";
import { type BrokerEventModels } from "../../../src/indexer-v2/types";
import checkRows from "../helpers/equality-checks";
import { type Account, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  fetchArenaRegistryView,
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
} from "../../../src/markets/arena-utils";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { getPublisher } from "../../utils";
import checkArenaRows from "../helpers/arena-equality-checks";
import { fetchNumRegisteredMarkets } from "../../../src/indexer-v2";

const MAX_WAIT_TIME = 5000;

const BROKER_URL = process.env.NEXT_PUBLIC_BROKER_URL!;
export const connectNewClient = async () => {
  expect(BROKER_URL).toBeDefined();
  const client = new WebSocket(new URL(BROKER_URL));
  const messageEvents: MessageEvent<string>[] = [];
  const brokerMessages: BrokerMessage[] = [];
  const events: BrokerEventModels[] = [];

  /**
   * Copy the functionality in the parser function so we have more granular access to the data.
   * @see convertWebSocketMessageToBrokerEvent
   */
  client.onmessage = (e: MessageEvent<string>) => {
    messageEvents.push(e);
    const parsed = parseJSONWithBigInts<BrokerMessage>(e.data);
    const [brokerEvent, message] = Object.entries(parsed)[0] as [BrokerEvent, BrokerJsonTypes];
    brokerMessages.push({
      [brokerEvent]: message,
    } as BrokerMessage);
    events.push(brokerMessageConverter[brokerEvent](message));
  };

  // Wait for the connection to be established.
  await waitFor({
    condition: () => client.readyState === client.OPEN,
    interval: 10,
    maxWaitTime: MAX_WAIT_TIME,
    errorMessage: "Client `readyState` is not `OPEN` after maximum wait time.",
  });
  expect(client.readyState).toEqual(client.OPEN);

  return {
    client,
    messageEvents,
    brokerMessages,
    events,
  };
};

export const compareParsedData = <T extends BrokerEventModels>({
  messageEvent,
  brokerMessage,
  event,
  eventName,
  response,
}: {
  messageEvent?: MessageEvent<string>;
  brokerMessage?: BrokerMessage;
  event?: T;
  eventName: BrokerEvent;
  response: UserTransactionResponse;
}) => {
  expect(messageEvent).toBeDefined();
  expect(brokerMessage).toBeDefined();
  expect(event).toBeDefined();
  if (!messageEvent) throw new Error("Never.");
  if (!brokerMessage) throw new Error("Never.");
  if (!event) throw new Error("Never.");
  const parsed = parseJSONWithBigInts<BrokerMessage>(messageEvent.data);
  expect(parsed).toEqual(brokerMessage);
  const row = parsed[eventName];
  const model = brokerMessageConverter[eventName](row) as T;

  const checkRowFunction =
    checkRows[eventName as keyof typeof checkRows] ??
    checkArenaRows[eventName as keyof typeof checkArenaRows];
  expect(checkRowFunction).toBeDefined();

  // To avoid duplicated code, cast as `any` but it's definitely the proper type.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const res1 = checkRowFunction(event as any, response);
  const res2 = checkRowFunction(model as any, response);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  expect(res1).toBe(true);
  expect(res2).toBe(true);
};

export const subscribe = (
  client: WebSocket,
  markets: AnyNumberString[],
  eventTypes: SubscribableBrokerEvents[],
  arena: boolean = false
) => {
  const outgoingMessage: SubscriptionMessage = {
    markets: markets.map((n) => Number(n)),
    event_types: eventTypes,
    arena,
  };
  const json = JSON.stringify(outgoingMessage);
  client.send(json);
};

export const customWaitFor = async (condition: () => boolean) =>
  waitFor({
    condition,
    interval: 10,
    maxWaitTime: 5000,
    errorMessage: `Maximum wait time exceeded for test: ${expect.getState().currentTestName}.`,
  });

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
export const registerAndUnlockInitialMarketsForArenaTest = async (newSymbol: SymbolEmoji[]) => {
  const emojicoin = new EmojicoinClient();
  const publisher = getPublisher();
  const numMarkets = await fetchNumRegisteredMarkets();
  if (numMarkets !== 2) {
    throw new Error("This function should only be called once per jest test instance.");
  }
  expect(numMarkets).toEqual(2);

  // Register the market passed in.
  await emojicoin.register(publisher, newSymbol);

  await fetchArenaRegistryView().then((res) =>
    fetchArenaMeleeView(res.currentMeleeID)
      .then(fetchMeleeEmojiData)
      .then(async ({ market1, market2 }) => {
        await emojicoin.buy(publisher, market1.symbolEmojis, 1n);
        await emojicoin.buy(publisher, market2.symbolEmojis, 1n);
      })
  );

  // And unlock it- aka, end its grace period.
  const res = await emojicoin.buy(publisher, newSymbol, 1n);
  expect(res.response.success).toBe(true);
};

export const ONE_MINUTE_MICROSECONDS = 1n * 60n * 1000n * 1000n;

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
  await emojicoin.arena.enter(publisher, 1n, false, symbol1, symbol2, "symbol1");
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
