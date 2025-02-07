import { type AnyNumberString, EmojicoinArena, getAptosClient, waitFor } from "../../../src";
import {
  type BrokerEvent,
  type BrokerMessage,
  brokerMessageConverter,
  type SubscribableBrokerEvents,
  type SubscriptionMessage,
} from "../../../src/broker-v2/types";
import { type BrokerJsonTypes } from "../../../src/indexer-v2/types/json-types";
import { parseJSONWithBigInts } from "../../../src/indexer-v2/json-bigint";
import { type BrokerModelTypes } from "../../../src/indexer-v2/types";
import checkRows from "../helpers/equality-checks";
import { Account, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  fetchArenaRegistryView,
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
} from "../../../src/markets/arena-utils";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { getPublisherPrivateKey } from "../../utils";
import checkArenaRows from "../helpers/arena-equality-checks";

const MAX_WAIT_TIME = 5000;

const BROKER_URL = process.env.NEXT_PUBLIC_BROKER_URL!;
export const connectNewClient = async () => {
  expect(BROKER_URL).toBeDefined();
  const client = new WebSocket(new URL(BROKER_URL));
  const messageEvents: MessageEvent<string>[] = [];
  const brokerMessages: BrokerMessage[] = [];
  const events: BrokerModelTypes[] = [];

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

export const compareParsedData = <T extends BrokerModelTypes>({
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
 * Have the publisher trade on both markets it registered to unlock them by ending the grace period.
 */
export const unlockInitialMarkets = async () => {
  const { currentMeleeID } = await fetchArenaRegistryView();
  const melee = await fetchArenaMeleeView(currentMeleeID).then(fetchMeleeEmojiData);
  const emojicoin = new EmojicoinClient();
  const publisher = Account.fromPrivateKey({
    privateKey: getPublisherPrivateKey(),
  });
  const res1 = await emojicoin.buy(publisher, melee.market1.symbolEmojis, 1n);
  const res2 = await emojicoin.buy(publisher, melee.market2.symbolEmojis, 1n);
  expect(res1.response.success).toBe(true);
  expect(res2.response.success).toBe(true);
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
