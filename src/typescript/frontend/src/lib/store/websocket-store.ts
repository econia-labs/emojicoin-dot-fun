"use client";

import { createStore } from "zustand/vanilla";
import mqtt, { type MqttClient } from "mqtt";
import { type ZustandSetStore } from "./types";
import { type AnyNumberString } from "../../../../sdk/src/types/types";
import { TopicBuilder } from "../mqtt";
import { MQTT_URL } from "lib/env";
import { type EventStore } from "./event-store";

export type ClientState = {
  client: MqttClient;
  subscriptions: Set<string>;
  connected: boolean;
  disconnected: boolean;
  reconnecting: boolean;
  received: number;
};

export type ClientActions = {
  connect: (eventStore: EventStore) => void;
  close: () => void;
  unsubscribeAll: () => void;
  updateConnection: () => void;
  subscribe: {
    chat: (marketID: AnyNumberString | null) => void;
    swap: (marketID: AnyNumberString | null, stateTransitions: boolean | null) => void;
    periodicState: (marketID: AnyNumberString | null, period: number | null) => void;
    marketRegistration: (marketID: AnyNumberString | null) => void;
    state: (marketID: AnyNumberString | null) => void;
    liquidity: (marketID: AnyNumberString | null) => void;
    globalState: () => void;
  };
  unsubscribe: {
    chat: (marketID: AnyNumberString | null) => void;
    swap: (marketID: AnyNumberString | null, stateTransitions: boolean | null) => void;
    periodicState: (marketID: AnyNumberString | null, period: number | null) => void;
    marketRegistration: (marketID: AnyNumberString | null) => void;
    state: (marketID: AnyNumberString | null) => void;
    liquidity: (marketID: AnyNumberString | null) => void;
    globalState: () => void;
  };
};

export type WebSocketClientStore = ClientState & ClientActions;

const subscribeHelper = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
  return set((state) => {
    // Only subscribe in the client if we're not already subscribed.
    if (!state.subscriptions.has(topic)) {
      state.client.subscribe(topic);
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.add(topic);
      return {
        subscriptions: newSubscriptions,
      };
    } else {
      return {
        subscriptions: state.subscriptions,
      };
    }
  });
};
const unsubscribeHelper = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
  return set((state) => {
    state.client.unsubscribe(topic);
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.delete(topic);
    return {
      subscriptions: newSubscriptions,
    };
  });
};
export const createWebSocketClientStore = () => {
  return createStore<WebSocketClientStore>((set, get) => ({
    client: mqtt.connect(MQTT_URL, {
      // protocol: "wss", // This can be determined by the URL.
      manualConnect: true,
    }),
    stream: [],
    received: 0,
    connect: (eventStore: EventStore) => {
      const client = get().client;
      const connected = client.connected;
      if (!connected) {
        client.connect();
        client.on("message", (topic, data) => {
          try {
            eventStore.pushEventFromWebSocket(data);
            set((state) => ({
              received: state.received + 1,
            }));
          } catch (e) {
            console.error("Error parsing message from topic:", topic, e);
          }
        });

        client.on("connect", () => {
          set({ connected: true });
        });
        client.on("disconnect", () => {
          set({ disconnected: true });
        });
        client.on("reconnect", () => {
          set({ reconnecting: true });
        });
        client.on("error", (err) => {
          console.error("Error with MQTT client:", err);
        });
      }
    },
    close: () => {
      get().client.end();
    },
    subscriptions: new Set<string>(),
    unsubscribeAll: () => {
      set((state) => {
        state.subscriptions.forEach((topic) => {
          state.client.unsubscribe(topic);
        });
        return {
          subscriptions: new Set<string>(),
        };
      });
    },
    updateConnection: () =>
      set((state) => ({
        connected: state.client.connected,
        disconnected: state.client.disconnected,
        reconnecting: state.client.reconnecting,
      })),
    connected: false as boolean,
    disconnected: false as boolean,
    reconnecting: false as boolean,
    subscribe: {
      chat: (m) => subscribeHelper(set, TopicBuilder.chatTopic(m)),
      swap: (m, st) => subscribeHelper(set, TopicBuilder.swapTopic(m, st)),
      periodicState: (m, p) => subscribeHelper(set, TopicBuilder.periodicState(m, p)),
      marketRegistration: (m) => subscribeHelper(set, TopicBuilder.marketRegistrationTopic(m)),
      state: (m) => subscribeHelper(set, TopicBuilder.stateTopic(m)),
      liquidity: (m) => subscribeHelper(set, TopicBuilder.liquidityTopic(m)),
      globalState: () => subscribeHelper(set, TopicBuilder.globalStateTopic()),
    },
    unsubscribe: {
      chat: (m) => unsubscribeHelper(set, TopicBuilder.chatTopic(m)),
      swap: (m, st) => unsubscribeHelper(set, TopicBuilder.swapTopic(m, st)),
      periodicState: (m, p) => unsubscribeHelper(set, TopicBuilder.periodicState(m, p)),
      marketRegistration: (m) => unsubscribeHelper(set, TopicBuilder.marketRegistrationTopic(m)),
      state: (m) => unsubscribeHelper(set, TopicBuilder.stateTopic(m)),
      liquidity: (m) => unsubscribeHelper(set, TopicBuilder.liquidityTopic(m)),
      globalState: () => unsubscribeHelper(set, TopicBuilder.globalStateTopic()),
    },
  }));
};
