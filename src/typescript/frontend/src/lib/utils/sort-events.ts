import {
  type AnyEmojicoinEvent,
  isChatEvent,
  isGlobalStateEvent,
  isLiquidityEvent,
  isMarketRegistrationEvent,
  isPeriodicStateEvent,
  isStateEvent,
  isSwapEvent,
  type Types,
} from "@sdk-types";

export const sortByValue = <T extends bigint | number>(
  nonceA: T,
  nonceB: T,
  order: "asc" | "desc" = "desc"
) => {
  if (nonceA === nonceB) {
    return 0;
  }
  if (nonceA < nonceB) {
    return order === "desc" ? 1 : -1;
  }
  return order === "desc" ? -1 : 1;
};

type Chat = Types.ChatEvent;
type Swap = Types.SwapEvent;
type Liquidity = Types.LiquidityEvent;
type State = Types.StateEvent;
type PeriodicState = Types.PeriodicStateEvent;
type MarketRegistration = Types.MarketRegistrationEvent;
type GlobalState = Types.GlobalStateEvent;

/**
 * This function sorts an array. It mutates the original array and returns nothing.
 * NOTE: It assumes that the array is homogenous.
 */
export const sortEvents = <T extends AnyEmojicoinEvent>(
  arr: T[],
  order: "asc" | "desc" = "desc"
) => {
  if (arr.length <= 1) {
    return;
  } else {
    if (isChatEvent(arr[0])) {
      (arr as Chat[]).sort((a, b) => sortByValue(a.emitMarketNonce, b.emitMarketNonce, order));
    } else if (isSwapEvent(arr[0])) {
      (arr as Swap[]).sort((a, b) => sortByValue(a.marketNonce, b.marketNonce, order));
    } else if (isLiquidityEvent(arr[0])) {
      (arr as Liquidity[]).sort((a, b) => sortByValue(a.marketNonce, b.marketNonce, order));
    } else if (isStateEvent(arr[0])) {
      (arr as State[]).sort((a, b) => sortByValue(a.lastSwap.nonce, b.lastSwap.nonce, order));
    } else if (isPeriodicStateEvent(arr[0])) {
      (arr as PeriodicState[]).sort((a, b) =>
        sortByValue(
          a.periodicStateMetadata.emitMarketNonce,
          b.periodicStateMetadata.emitMarketNonce,
          order
        )
      );
    } else if (isMarketRegistrationEvent(arr[0])) {
      (arr as MarketRegistration[]).sort((a, b) => sortByValue(a.marketID, b.marketID, order));
    } else if (isGlobalStateEvent(arr[0])) {
      (arr as GlobalState[]).sort((a, b) => sortByValue(a.registryNonce, b.registryNonce, order));
    } else {
      throw new Error("Invalid array type.");
    }
  }
};

export const mergeSortedEvents = <T extends AnyEmojicoinEvent>(
  existing: readonly T[],
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

export const toSortedDedupedEvents = <T extends AnyEmojicoinEvent>(
  a: readonly T[],
  b: readonly T[],
  order: "asc" | "desc" = "desc"
) => {
  const recorded = new Set<string>();
  const deduped = [...a, ...b].filter((event) => {
    if (recorded.has(event.guid)) return false;
    recorded.add(event.guid);
    return true;
  });
  sortEvents(deduped, order);
  return deduped;
};
