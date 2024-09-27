"use client";

import { createStore, type StoreApi } from "zustand/vanilla";
import { BROKER_URL } from "lib/env";
import { type EventStore } from "@/store/event/types";
import {
  getSingletonClient,
  type WebSocketClient,
  type WebSocketSubscriptions,
} from "@/broker/client";
import { type BrokerEvent } from "@/broker/types";

export type ClientState = {
  client: WebSocketClient;
  connected: boolean;
  received: number;
  subscriptions: WebSocketSubscriptions;
};

export type ClientActions = {
  close: () => void;
  subscribeEvents: (events: BrokerEvent[]) => void;
  unsubscribeEvents: (events: BrokerEvent[]) => void;
};

export type WebSocketClientStore = ClientState & ClientActions;

const PERMANENTLY_SUBSCRIBE_REGISTRATIONS = true;

export const createWebSocketClientStore = (eventStore: StoreApi<EventStore>) => {
  return createStore<WebSocketClientStore>((set, get) => ({
    subscriptions: {
      marketIDs: new Set(),
      eventTypes: new Set(),
    },
    received: 0,
    client: getSingletonClient({
      url: BROKER_URL,
      listeners: {
        onMessage: (e) => {
          // eventStore.getState().pushEventFromClient(e);
          eventStore.setState((state) => {
            state.pushEventFromClient(e);
            return state;
          });
          set((state) => ({
            received: state.received + 1,
          }));
        },
        onConnect: () => set({ connected: true }),
        onClose: () => set({ connected: false }),
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
        return { subscriptions: state.client.subscriptions };
      });
    },
    unsubscribeEvents: (e) => {
      set((state) => {
        state.client.unsubscribeEvents(e);
        return { subscriptions: state.client.subscriptions };
      });
    },
  }));
};
