"use client";

import { createStore } from "zustand/vanilla";
import mqtt, { type MqttClient } from "mqtt";
import { type ZustandSetStore } from "./types";
import { type AnyNumberString } from "../../../../sdk/src/types/types";
import { TopicBuilder } from "../mqtt";
import { MQTT_URL } from "lib/env";
import { type EventStore } from "./event-store";
import { deserializeEvent } from "./event-utils";

export type ClientState = {
  client: MqttClient;
  connected: boolean;
  disconnected: boolean;
  reconnecting: boolean;
  received: number;
  // Note that we always subscribe immediately upon request from any of our components.
  // This is so we can always know which subscriptions are lively at any given time.
  // We could implement/abstract a delay here if it becomes a performance issue for the
  // mqtt server- but for now we'll just use the unsubscription de-thrashing mechanism below.
  subscriptions: Set<string>;
  // However, to avoid subscription thrashing, we'll keep a queue of topics to unsubscribe from.
  // We only unsubscribe from the topic if it's found in the unsubscription queue some N times,
  // checked on a polling basis.
  // We evict from the unsubscription queue if the topic is present in the subscription set.
  unsubscriptionRequests: Map<string, number>;
  pollingInterval: number | null;
};

export type ClientActions = {
  connect: (eventStore: EventStore) => void;
  close: () => void;
  subscribe: {
    chat: (marketID: AnyNumberString | null) => void;
    swap: (marketID: AnyNumberString | null, stateTransitions: boolean | null) => void;
    periodicState: (marketID: AnyNumberString | null, period: number | null) => void;
    marketRegistration: (marketID: AnyNumberString | null) => void;
    state: (marketID: AnyNumberString | null) => void;
    liquidity: (marketID: AnyNumberString | null) => void;
    globalState: () => void;
  };
  requestUnsubscribe: {
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

// Note this also deletes the topic from the unsubscription queue, because it's essentially
// being marked as "fresh" by being subscribed to.
const subscribeHelper = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
  set((state) => {
    const unsubscriptionRequests = state.unsubscriptionRequests;
    unsubscriptionRequests.delete(topic);

    // Only subscribe in the client if we're not already subscribed.
    if (!state.subscriptions.has(topic)) {
      state.client.subscribe(topic);
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.add(topic);
      return {
        subscriptions: newSubscriptions,
        unsubscriptionRequests,
      };
    } else {
      return {
        unsubscriptionRequests,
      };
    }
  });
};

const requestUnsubscribe = (set: ZustandSetStore<WebSocketClientStore>, topic: string) => {
  set((state) => {
    const unsubscriptionRequests = state.unsubscriptionRequests;
    // We only add the request to the unsubscription requests if it isn't already in the
    // unsubscribe queue and it's also in the subscriptions set, otherwise there's no reason
    // to add it to the unsubscription queue.
    // Note that the actual increment logic is handled by the polling interval.
    if (!unsubscriptionRequests.has(topic) && state.subscriptions.has(topic)) {
      unsubscriptionRequests.set(topic, 0);
      return {
        unsubscriptionRequests,
      };
    }
    return {
      unsubscriptionRequests,
    };
  });
};

export const NUM_TICKS_BEFORE_UNSUBSCRIBE = 3;
export const CHECK_UNSUBSCRIBE_INTERVAL = 10000;
// This is the delay before a component will re-request to subscribe to a topic while mounted.
// Note that a request to subscribe to an already subscribed topic will not cause a re-subscribe,
// it will just purge the topic from the unsubscription queue if it somehow managed to get in there.
export const RESUBSCRIPTION_DELAY = 5000;

const initializeSubscriptionManager = (set: ZustandSetStore<WebSocketClientStore>) => {
  if (typeof window === "undefined") return null;

  return window.setInterval(() => {
    set((state) => {
      const unsubscriptionRequests = state.unsubscriptionRequests;
      const subscriptions = state.subscriptions;

      for (const [topic, count] of unsubscriptionRequests.entries()) {
        if (count > NUM_TICKS_BEFORE_UNSUBSCRIBE) {
          state.client.unsubscribe(topic);
          subscriptions.delete(topic);
          unsubscriptionRequests.delete(topic);
        } else {
          unsubscriptionRequests.set(topic, count + 1);
        }
      }

      return {
        unsubscriptionRequests,
        subscriptions,
      };
    });
  }, CHECK_UNSUBSCRIBE_INTERVAL);
};

export const createWebSocketClientStore = () => {
  return createStore<WebSocketClientStore>((set, get) => ({
    client: mqtt.connect(MQTT_URL, {
      // Force the client to wait for us to manually call connect instead of doing it upon
      // instantiation of the client object.
      manualConnect: true,
    }),
    stream: [],
    received: 0,
    pollingInterval: initializeSubscriptionManager(set),
    unsubscriptionRequests: new Map<string, number>(),
    connect: (eventStore: EventStore) => {
      const client = get().client;
      const connected = client.connected;
      if (!connected) {
        client.connect();
        client.on("message", (topic, buffer) => {
          try {
            const json = JSON.parse(buffer.toString());
            if (!json) return;
            const data = deserializeEvent(json, json.transaction_version);
            if (!data) return;
            eventStore.pushEventFromClient(data.event);
            set((state) => ({
              received: state.received + 1,
            }));
          } catch (e) {
            console.error("Error parsing message from topic:", topic, e);
          }
        });
        client.on("connect", () => set({ connected: true, disconnected: false }));
        client.on("disconnect", () => set({ connected: false, disconnected: true }));
        client.on("reconnect", () => set({ reconnecting: true }));
        client.on("error", (err) => {
          console.error("Error with MQTT client:", err);
        });
      }
    },
    close: () => {
      get().client.end();
      set({
        connected: false,
        disconnected: true,
      });
    },
    subscriptions: new Set<string>(),
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
    requestUnsubscribe: {
      chat: (m) => requestUnsubscribe(set, TopicBuilder.chatTopic(m)),
      swap: (m, st) => requestUnsubscribe(set, TopicBuilder.swapTopic(m, st)),
      periodicState: (m, p) => requestUnsubscribe(set, TopicBuilder.periodicState(m, p)),
      marketRegistration: (m) => requestUnsubscribe(set, TopicBuilder.marketRegistrationTopic(m)),
      state: (m) => requestUnsubscribe(set, TopicBuilder.stateTopic(m)),
      liquidity: (m) => requestUnsubscribe(set, TopicBuilder.liquidityTopic(m)),
      globalState: () => requestUnsubscribe(set, TopicBuilder.globalStateTopic()),
    },
  }));
};
