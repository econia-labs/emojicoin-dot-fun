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

const sub = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
  return set((state) => {
    state.client.subscribe(topic);
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.add(topic);
    return {
      subscriptions: newSubscriptions,
    };
  });
};
const unsub = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
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
      protocol: "wss",
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
          console.debug("Received message from topic:", topic);
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
      chat: (m) => sub(set, TopicBuilder.chatTopic(m)),
      swap: (m, st) => sub(set, TopicBuilder.swapTopic(m, st)),
      periodicState: (m, p) => sub(set, TopicBuilder.periodicState(m, p)),
      marketRegistration: (m) => sub(set, TopicBuilder.marketRegistrationTopic(m)),
      state: (m) => sub(set, TopicBuilder.stateTopic(m)),
      liquidity: (m) => sub(set, TopicBuilder.liquidityTopic(m)),
      globalState: () => sub(set, TopicBuilder.globalStateTopic()),
    },
    unsubscribe: {
      chat: (m) => unsub(set, TopicBuilder.chatTopic(m)),
      swap: (m, st) => unsub(set, TopicBuilder.swapTopic(m, st)),
      periodicState: (m, p) => unsub(set, TopicBuilder.periodicState(m, p)),
      marketRegistration: (m) => unsub(set, TopicBuilder.marketRegistrationTopic(m)),
      state: (m) => unsub(set, TopicBuilder.stateTopic(m)),
      liquidity: (m) => unsub(set, TopicBuilder.liquidityTopic(m)),
      globalState: () => unsub(set, TopicBuilder.globalStateTopic()),
    },
  }));
};
