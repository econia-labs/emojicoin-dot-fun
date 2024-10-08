import { type AnyEmojicoinEvent } from "@sdk-types";
import {
  type AnyEventModel,
  type ChatEventModel,
  type GlobalStateEventModel,
  isGlobalStateEventModel,
  isMarketRegistrationEventModel,
  type MarketRegistrationEventModel,
  type SwapEventModel,
} from "@sdk/indexer-v2/types";

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
 * This function sorts an array. It mutates the original array and returns nothing.
 * Note that this is for sorting events that are all for the same type of data, i.e.,
 * all the same market or all global state events. This will not make sense for sorting
 * events across different markets or with global and non-global state events.
 * NOTE: It assumes that the array is homogenous.
 */
export const sortEvents = <T extends AnyEventModel>(arr: T[], order: "asc" | "desc" = "desc") => {
  if (arr.length <= 1) {
    return;
  } else {
    const first = arr[0];
    if (isGlobalStateEventModel(first)) {
      (arr as GlobalStateEventModel[]).sort(({ globalState: a }, { globalState: b }) =>
        sortByValue(a.registryNonce, b.registryNonce, order)
      );
    } else if (isMarketRegistrationEventModel(first)) {
      (arr as MarketRegistrationEventModel[]).sort(({ market: a }, { market: b }) =>
        sortByValue(a.marketID, b.marketID)
      );
    } else {
      (
        arr as Array<Exclude<AnyEventModel, GlobalStateEventModel | MarketRegistrationEventModel>>
      ).sort(({ market: a }, { market: b }) => sortByValue(a.marketNonce, b.marketNonce, order));
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

export const toSortedDedupedEvents = <T extends readonly AnyEventModel[]>(
  a: T,
  b: T,
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

export const HARD_LIMIT = 500;

export const memoizedSortedDedupedEvents = <
  T extends readonly ChatEventModel[] | readonly SwapEventModel[],
>({
  a,
  b,
  order = "desc",
  limit = HARD_LIMIT,
  canAnimateAsInsertion,
}: {
  a: T;
  b: T;
  order?: "asc" | "desc";
  limit?: number;
  canAnimateAsInsertion: boolean;
}): Array<T[number] & { shouldAnimateAsInsertion?: boolean }> => {
  const res = toSortedDedupedEvents(a, b, order) as Array<
    T[number] & { shouldAnimateAsInsertion?: boolean }
  >;
  if (res.length) {
    res[0] = {
      ...res[0],
      // A delay of the first swap animation as an insertion appears weird if it's the only row,
      // so the length of the swaps array is also checked to ensure it is greater than 1.
      shouldAnimateAsInsertion: canAnimateAsInsertion && res.length > 1,
    };
  }
  return res.slice(0, limit);
};
