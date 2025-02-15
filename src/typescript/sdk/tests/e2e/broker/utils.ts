import { type AnyNumberString, waitFor } from "../../../src";
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
import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import checkArenaRows from "../helpers/arena-equality-checks";

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

export const customWaitFor = async (condition: () => boolean, messageOnFailure?: () => string) =>
  waitFor({
    condition,
    interval: 10,
    maxWaitTime: 5000,
    errorMessage: messageOnFailure
      ? messageOnFailure()
      : `Maximum wait time exceeded for test: ${expect.getState().currentTestName}.`,
  });
