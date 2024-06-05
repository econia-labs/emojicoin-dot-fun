import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { converter } from "@sdk/emojicoin_dot_fun/events";
import { TYPE_TAGS } from "@sdk/utils";
import { type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { type EventStore } from "./event-store";
import { type SubmissionResponse } from "context/wallet-context/AptosContextProvider";

export function storeEvents(store: EventStore, data: Awaited<SubmissionResponse>): void {
  const response = data?.response;
  if (!response || !isUserTransactionResponse(response)) {
    return;
  }
  response.events.forEach((event): void => {
    const conversionFunction = converter.get(event.type);
    if (typeof conversionFunction !== "function") {
      return;
    }
    const data = conversionFunction(event.data, Number(response.version));
    switch (event.type) {
      case TYPE_TAGS.SwapEvent.toString():
        store.addSwapEvents({ data: data as Types.SwapEvent });
        break;
      case TYPE_TAGS.ChatEvent.toString():
        store.addChatEvents({ data: data as Types.ChatEvent });
        break;
      case TYPE_TAGS.MarketRegistrationEvent.toString():
        store.addMarketRegistrationEvents({ data: data as Types.MarketRegistrationEvent });
        break;
      case TYPE_TAGS.PeriodicStateEvent.toString():
        store.addPeriodicStateEvents({ data: data as Types.PeriodicStateEvent });
        break;
      case TYPE_TAGS.StateEvent.toString():
        store.addStateEvents({ data: data as Types.StateEvent });
        break;
      case TYPE_TAGS.GlobalStateEvent.toString():
        store.addGlobalStateEvents({ data: data as Types.GlobalStateEvent });
        break;
      case TYPE_TAGS.LiquidityEvent.toString():
        store.addLiquidityEvents({ data: data as Types.LiquidityEvent });
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  });
}

export const mergeSortedEvents = <T extends AnyEmojicoinEvent>(
  existing: T[],
  incoming: T[]
): T[] => {
  const merged: T[] = [];
  let i = 0;
  let j = 0;
  while (i < existing.length && j < incoming.length) {
    if (existing[i].version > incoming[j].version) {
      merged.push(existing[i]);
      i++;
    } else {
      merged.push(incoming[j]);
      j++;
    }
  }
  while (i < existing.length) {
    merged.push(existing[i]);
    i++;
  }
  while (j < incoming.length) {
    merged.push(incoming[j]);
    j++;
  }

  return merged;
};
