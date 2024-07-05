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

/**
 * This function sorts and returns a copied array.
 * NOTE: It assumes that the array is homogenous.
 */
export const toSortedEvents = <
  T extends
    | Types.ChatEvent
    | Types.SwapEvent
    | Types.LiquidityEvent
    | Types.StateEvent
    | Types.PeriodicStateEvent
    | Types.MarketRegistrationEvent
    | Types.GlobalStateEvent,
>(
  arr: readonly T[],
  order: "asc" | "desc" = "desc"
): T[] => {
  if (arr.length <= 1) {
    return [...arr];
  } else {
    if (isChatEvent(arr[0])) {
      return (arr as readonly Types.ChatEvent[]).toSorted((a, b) =>
        sortByValue(a.emitMarketNonce, b.emitMarketNonce, order)
      ) as T[];
    } else if (isSwapEvent(arr[0])) {
      return (arr as readonly Types.SwapEvent[]).toSorted((a, b) =>
        sortByValue(a.marketNonce, b.marketNonce, order)
      ) as T[];
    } else if (isLiquidityEvent(arr[0])) {
      return (arr as readonly Types.SwapEvent[]).toSorted((a, b) =>
        sortByValue(a.marketNonce, b.marketNonce, order)
      ) as T[];
    } else if (isStateEvent(arr[0])) {
      return (arr as readonly Types.StateEvent[]).toSorted((a, b) =>
        sortByValue(a.lastSwap.nonce, b.lastSwap.nonce, order)
      ) as T[];
    } else if (isPeriodicStateEvent(arr[0])) {
      return (arr as readonly Types.PeriodicStateEvent[]).toSorted((a, b) =>
        sortByValue(
          a.periodicStateMetadata.emitMarketNonce,
          b.periodicStateMetadata.emitMarketNonce,
          order
        )
      ) as T[];
    } else if (isMarketRegistrationEvent(arr[0])) {
      return (arr as readonly Types.MarketRegistrationEvent[]).toSorted((a, b) =>
        sortByValue(a.marketID, b.marketID, order)
      ) as T[];
    } else if (isGlobalStateEvent(arr[0])) {
      return (arr as readonly Types.GlobalStateEvent[]).toSorted((a, b) =>
        sortByValue(a.registryNonce, b.registryNonce, order)
      ) as T[];
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
  return toSortedEvents(deduped, order);
};
