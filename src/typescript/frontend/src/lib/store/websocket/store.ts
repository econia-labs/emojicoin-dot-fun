// cspell:word immerable
"use client";

import { type PeriodTypeFromBroker } from "@econia-labs/emojicoin-sdk";
import { immerable } from "immer";
import { BROKER_URL } from "lib/env";

import { WebSocketClient, type WebSocketClientArgs } from "@/broker/client";
import { type SubscribableBrokerEvents } from "@/broker/types";
import {
  type ImmerGetEventAndClientStore,
  type ImmerSetEventAndClientStore,
} from "@/store/event/types";

export type ClientState = {
  client: WebSocketClient;
  connected: boolean;
  received: number;
};

export type ClientActions = {
  close: () => void;
  subscribeEvents: (
    events: SubscribableBrokerEvents[],
    arena?: { baseEvents?: boolean; arenaPeriod?: PeriodTypeFromBroker }
  ) => void;
  unsubscribeEvents: (
    events: SubscribableBrokerEvents[],
    arena?: { baseEvents?: boolean; arenaPeriod?: PeriodTypeFromBroker }
  ) => void;
  subscribeToArenaPeriod: (period: PeriodTypeFromBroker) => void;
  unsubscribeFromArenaPeriod: (period: PeriodTypeFromBroker) => void;
};

export type WebSocketClientStore = ClientState & ClientActions;

const PERMANENTLY_SUBSCRIBE_REGISTRATIONS = true;

export class ImmerableWebSocketClient extends WebSocketClient {
  [immerable] = true;

  constructor(args: WebSocketClientArgs) {
    super(args);
  }
}

let singletonClient: ImmerableWebSocketClient;

export const getSingletonClient = (args: WebSocketClientArgs) => {
  if (!singletonClient) {
    singletonClient = new ImmerableWebSocketClient(args);
  }
  return singletonClient;
};

export const createWebSocketClientStore = (
  set: ImmerSetEventAndClientStore,
  get: ImmerGetEventAndClientStore
): WebSocketClientStore => ({
  received: 0,
  client: getSingletonClient({
    url: BROKER_URL,
    listeners: {
      onMessage: (e) => {
        set((state) => {
          state.received += 1;
        });
        get().pushEventsFromClient([e]);
      },
      onConnect: () => {
        set((state) => {
          state.connected = true;
        });
      },
      onClose: () => {
        set((state) => {
          state.connected = false;
        });
      },
      onError: (e) => console.error(e),
    },
    permanentlySubscribeToMarketRegistrations: PERMANENTLY_SUBSCRIBE_REGISTRATIONS,
  }),
  connected: false as boolean,
  close: () => {
    get().client.client.close();
  },
  subscribeToArenaPeriod: (period) => {
    get().client.subscribeToArenaPeriod(period);
  },
  unsubscribeFromArenaPeriod: (period) => {
    get().client.unsubscribeFromArenaPeriod(period);
  },
  subscribeEvents: (e, arena) => {
    set((state) => {
      state.client.subscribeEvents(e, arena);
    });
  },
  unsubscribeEvents: (e, arena) => {
    set((state) => {
      state.client.unsubscribeEvents(e, arena);
    });
  },
});
