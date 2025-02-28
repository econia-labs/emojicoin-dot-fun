import { type fetchSenderSwapEvents } from "@/queries/market";
import { type AnyNumberString } from "@sdk-types";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseJSON } from "utils";

export type SwapEvent = Awaited<ReturnType<typeof fetchSenderSwapEvents>>[number];

export const useSwapEventsQuery = (address?: string, marketId?: AnyNumberString) => {
  const query = useInfiniteQuery<SwapEvent[]>({
    queryKey: ["fetchSwapEvents", address, marketId],
    queryFn: ({ pageParam }) =>
      fetch(`/wallet/${address}/swaps?page=${pageParam}${marketId ? `&market_id=${marketId}` : ""}`)
        .then(async (res) => res.text())
        .then((res) => parseJSON(res)),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    enabled: !!address,
  });

  return query;
};
