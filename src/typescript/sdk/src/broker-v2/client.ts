import { parseJSONWithBigInts } from "../indexer-v2/json-bigint";
import { type BrokerModelTypes } from "../indexer-v2/types";
import { type BrokerJsonTypes } from "../indexer-v2/types/json-types";
import { type AnyNumberString } from "../types";
import { ensureArray } from "../utils/misc";
import {
  type BrokerEvent,
  type BrokerMessage,
  brokerMessageConverter,
  type SubscribableBrokerEvents,
  type SubscriptionMessage,
  type WebSocketSubscriptions,
} from "./types";

const SendToBroker = (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value;
  /* eslint-disable-next-line func-names, no-param-reassign */
  descriptor.value = function (...args: unknown[]) {
    const result = originalMethod.apply(this, args);
    (this as WebSocketClient).sendToBroker();
    return result;
  };
  return descriptor;
};

export const convertWebSocketMessageToBrokerEvent = <T extends string>(e: MessageEvent<T>) => {
  const response = parseJSONWithBigInts<BrokerMessage>(e.data);
  const [brokerEvent, message] = Object.entries(response)[0] as [BrokerEvent, BrokerJsonTypes];
  const event = brokerMessageConverter[brokerEvent](message);
  return event;
};

type WebSocketClientEventListeners = {
  onMessage: (e: BrokerModelTypes) => void;
  onConnect?: (e: Event) => void;
  onClose?: (e: CloseEvent) => void;
  onError?: (e: Event) => void;
};

/* eslint-disable-next-line import/no-unused-modules */
export type WebSocketClientArgs = {
  url: string | URL;
  listeners: WebSocketClientEventListeners;
  permanentlySubscribeToMarketRegistrations: boolean;
};

/* eslint-disable-next-line import/no-unused-modules */
export class WebSocketClient {
  public readonly client: WebSocket;

  public subscriptions: WebSocketSubscriptions;

  public permanentlySubscribeToMarketRegistrations: boolean;

  public subscribedTo: {
    allMarkets: boolean;
    allBaseEvents: boolean;
  };

  constructor({
    url,
    listeners,
    permanentlySubscribeToMarketRegistrations = true,
  }: WebSocketClientArgs) {
    const { onMessage, onConnect, onClose, onError } = listeners;
    this.permanentlySubscribeToMarketRegistrations = permanentlySubscribeToMarketRegistrations;
    this.subscribedTo = {
      allMarkets: false,
      allBaseEvents: false,
    };
    this.subscriptions = {
      marketIDs: new Set(),
      eventTypes: new Set(),
      arena: false,
    };
    this.client = new WebSocket(new URL(url));

    this.setOnMessage(onMessage);
    if (onConnect) this.setOnConnect(onConnect);
    if (onClose) this.setOnClose(onClose);
    if (onError) this.setOnError(onError);
  }

  public setOnMessage(onMessage: WebSocketClientEventListeners["onMessage"]) {
    this.client.onmessage = (e: MessageEvent<string>) => {
      const event = convertWebSocketMessageToBrokerEvent(e);
      onMessage(event);
    };
  }

  public setOnConnect(onConnect: NonNullable<WebSocketClientEventListeners["onConnect"]>) {
    this.client.onopen = (e: Event) => {
      this.sendToBroker();
      onConnect(e);
    };
  }

  public setOnClose(onClose: NonNullable<WebSocketClientEventListeners["onClose"]>) {
    this.client.onclose = (e: CloseEvent) => {
      onClose(e);
    };
  }

  public setOnError(onError: NonNullable<WebSocketClientEventListeners["onError"]>) {
    this.client.onerror = (e: Event) => {
      onError(e);
    };
  }

  @SendToBroker
  public subscribeMarkets(input: AnyNumberString | AnyNumberString[]) {
    const newMarkets = new Set(ensureArray(input));
    newMarkets.forEach((e) => this.subscriptions.marketIDs.add(e));
  }

  @SendToBroker
  public subscribeEvents(input: SubscribableBrokerEvents | SubscribableBrokerEvents[]) {
    const newTypes = new Set(ensureArray(input));
    newTypes.forEach((e) => this.subscriptions.eventTypes.add(e));
    if (this.permanentlySubscribeToMarketRegistrations) {
      this.subscriptions.eventTypes.add("MarketRegistration");
    }
  }

  @SendToBroker
  public subscribeArena() {
    this.subscriptions.arena = true;
  }

  @SendToBroker
  public unsubscribeMarkets(input: AnyNumberString | AnyNumberString[]) {
    const newMarkets = new Set(ensureArray(input));
    newMarkets.forEach((e) => this.subscriptions.marketIDs.delete(e));
  }

  @SendToBroker
  public unsubscribeEvents(input: SubscribableBrokerEvents | SubscribableBrokerEvents[]) {
    const newTypes = new Set(ensureArray(input));
    if (this.permanentlySubscribeToMarketRegistrations) {
      newTypes.delete("MarketRegistration");
    }
    newTypes.forEach((e) => this.subscriptions.eventTypes.delete(e));
  }

  @SendToBroker
  public unsubscribeArena() {
    this.subscriptions.arena = false;
  }

  public sendToBroker() {
    if (this.client.readyState !== this.client.OPEN) {
      return;
    }
    const subscriptionMessage: SubscriptionMessage = {
      markets: this.subscribedTo.allMarkets
        ? []
        : Array.from(this.subscriptions.marketIDs).map(Number),
      event_types: this.subscribedTo.allBaseEvents ? [] : Array.from(this.subscriptions.eventTypes),
      arena: this.subscriptions.arena,
    };
    const msg = JSON.stringify(subscriptionMessage);
    this.client.send(msg);
  }
}
