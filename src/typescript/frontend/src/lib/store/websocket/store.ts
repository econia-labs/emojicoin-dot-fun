// cspell:word immerable
"use client";

import { BROKER_URL } from "lib/env";
import {
  type ImmerGetEventAndClientStore,
  type ImmerSetEventAndClientStore,
} from "@/store/event/types";
import { WebSocketClient, type WebSocketClientArgs } from "@/broker/client";
import { type SubscribableBrokerEvents, type WebSocketSubscriptions } from "@/broker/types";
import { immerable } from "immer";

export type ClientState = {
  client: WebSocketClient;
  connected: boolean;
  received: number;
  subscriptions: WebSocketSubscriptions;
};

export type ClientActions = {
  close: () => void;
  subscribeEvents: (events: SubscribableBrokerEvents[]) => void;
  unsubscribeEvents: (events: SubscribableBrokerEvents[]) => void;
  subscribeArena: () => void;
  unsubscribeArena: () => void;
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
  subscriptions: {
    marketIDs: new Set(),
    eventTypes: new Set(),
    arena: false,
  },
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
  subscribeEvents: (e) => {
    set((state) => {
      state.client.subscribeEvents(e);
      state.subscriptions = state.client.subscriptions;
    });
  },
  unsubscribeEvents: (e) => {
    set((state) => {
      state.client.unsubscribeEvents(e);
      state.subscriptions = state.client.subscriptions;
    });
  },
  subscribeArena: () => {
    set((state) => {
      state.client.subscribeArena();
      state.subscriptions.arena = true;
    });
  },
  unsubscribeArena: () => {
    set((state) => {
      state.client.unsubscribeArena();
      state.subscriptions.arena = false;
    });
  },
});
