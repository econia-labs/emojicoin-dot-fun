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
import {
  type ArenaExitModel,
  type ArenaMeleeModel,
  type ArenaSwapModel,
  type ArenaVaultBalanceUpdateModel,
  type ArenaEnterModel,
  type BrokerModelTypes,
  type ChatEventModel,
  type GlobalStateEventModel,
  type LiquidityEventModel,
  type MarketLatestStateEventModel,
  type MarketRegistrationEventModel,
  type PeriodicStateEventModel,
  type SwapEventModel,
} from "../../../src/indexer-v2/types";
import RowEqualityChecks from "../helpers/equality-checks";
import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import ArenaRowEqualityChecks from "../helpers/arena-equality-checks";

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
  switch (eventName) {
    case "Chat":
      RowEqualityChecks["Chat"](model as ChatEventModel, response);
      RowEqualityChecks["Chat"](event as ChatEventModel, response);
      break;
    case "Swap":
      RowEqualityChecks["Swap"](model as SwapEventModel, response);
      RowEqualityChecks["Swap"](event as SwapEventModel, response);
      break;
    case "Liquidity":
      RowEqualityChecks["Liquidity"](model as LiquidityEventModel, response);
      RowEqualityChecks["Liquidity"](event as LiquidityEventModel, response);
      break;
    case "MarketLatestState":
      RowEqualityChecks["MarketLatestState"](model as MarketLatestStateEventModel, response);
      RowEqualityChecks["MarketLatestState"](event as MarketLatestStateEventModel, response);
      break;
    case "GlobalState":
      RowEqualityChecks["GlobalState"](model as GlobalStateEventModel, response);
      RowEqualityChecks["GlobalState"](event as GlobalStateEventModel, response);
      break;
    case "PeriodicState":
      RowEqualityChecks["PeriodicState"](model as PeriodicStateEventModel, response);
      RowEqualityChecks["PeriodicState"](event as PeriodicStateEventModel, response);
      break;
    case "MarketRegistration":
      RowEqualityChecks["MarketRegistration"](model as MarketRegistrationEventModel, response);
      RowEqualityChecks["MarketRegistration"](event as MarketRegistrationEventModel, response);
      break;
    case "ArenaEnter":
      ArenaRowEqualityChecks["ArenaEnter"](model as ArenaEnterModel, response);
      ArenaRowEqualityChecks["ArenaEnter"](event as ArenaEnterModel, response);
    case "ArenaExit":
      ArenaRowEqualityChecks["ArenaExit"](model as ArenaExitModel, response);
      ArenaRowEqualityChecks["ArenaExit"](event as ArenaExitModel, response);
    case "ArenaMelee":
      ArenaRowEqualityChecks["ArenaMelee"](model as ArenaMeleeModel, response);
      ArenaRowEqualityChecks["ArenaMelee"](event as ArenaMeleeModel, response);
    case "ArenaSwap":
      ArenaRowEqualityChecks["ArenaSwap"](model as ArenaSwapModel, response);
      ArenaRowEqualityChecks["ArenaSwap"](event as ArenaSwapModel, response);
    case "ArenaVaultBalanceUpdate":
      ArenaRowEqualityChecks["ArenaVaultBalanceUpdate"](
        model as ArenaVaultBalanceUpdateModel,
        response
      );
      ArenaRowEqualityChecks["ArenaVaultBalanceUpdate"](
        event as ArenaVaultBalanceUpdateModel,
        response
      );
    default:
      throw new Error("Will never happen.");
  }
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
