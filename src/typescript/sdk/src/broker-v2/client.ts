import { parseJSONWithBigInts } from "../indexer-v2/json-bigint";
import { type AnyEventModel } from "../indexer-v2/types";
import { type AnyEventDatabaseRow } from "../indexer-v2/types/json-types";
import { type AnyNumberString } from "../types";
import { ensureArray } from "../utils/misc";
import { type BrokerEvent, type BrokerMessage, brokerMessageConverter } from "./types";

/**
 * The message the client sends to the broker to subscribe or unsubscribe.
 */
type SubscriptionMessage = {
  markets: number[];
  event_types: BrokerEvent[];
};

/* eslint-disable-next-line import/no-unused-modules */
export type WebSocketSubscriptions = {
  marketIDs: Set<AnyNumberString>;
  eventTypes: Set<BrokerEvent>;
};

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

const convertWebSocketMessageToBrokerEvent = <T extends string>(e: MessageEvent<T>) => {
  const response: BrokerMessage = parseJSONWithBigInts(e.data);
  const [brokerEvent, message] = Object.entries(response)[0] as [BrokerEvent, AnyEventDatabaseRow];
  const event = brokerMessageConverter[brokerEvent](message);
  return event;
};

type WebSocketClientEventListeners = {
  onMessage: (e: AnyEventModel) => void;
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
    allEvents: boolean;
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
      allEvents: false,
    };
    this.subscriptions = {
      marketIDs: new Set(),
      eventTypes: new Set(),
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
  public subscribeEvents(input: BrokerEvent | BrokerEvent[]) {
    const newTypes = new Set(ensureArray(input));
    newTypes.forEach((e) => this.subscriptions.eventTypes.add(e));
    if (this.permanentlySubscribeToMarketRegistrations) {
      this.subscriptions.eventTypes.add("MarketRegistration");
    }
  }

  @SendToBroker
  public unsubscribeMarkets(input: AnyNumberString | AnyNumberString[]) {
    const newMarkets = new Set(ensureArray(input));
    newMarkets.forEach((e) => this.subscriptions.marketIDs.delete(e));
  }

  @SendToBroker
  public unsubscribeEvents(input: BrokerEvent | BrokerEvent[]) {
    const newTypes = new Set(ensureArray(input));
    if (this.permanentlySubscribeToMarketRegistrations) {
      newTypes.delete("MarketRegistration");
    }
    newTypes.forEach((e) => this.subscriptions.eventTypes.delete(e));
  }

  public sendToBroker() {
    if (this.client.readyState !== this.client.OPEN) {
      return;
    }
    const subscriptionMessage: SubscriptionMessage = {
      markets: this.subscribedTo.allMarkets
        ? []
        : Array.from(this.subscriptions.marketIDs).map(Number),
      event_types: this.subscribedTo.allEvents ? [] : Array.from(this.subscriptions.eventTypes),
    };
    const msg = JSON.stringify(subscriptionMessage);
    this.client.send(msg);
  }
}
