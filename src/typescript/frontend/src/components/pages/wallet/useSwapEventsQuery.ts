import { type fetchSwapEvents } from "@/queries/market";
import { type AnyNumberString } from "@sdk-types";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import { axiosInstance } from "utils/axios";

export type SwapEvent = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

export const useSwapEventsQuery = ({
  sender,
  marketId,
}: {
  sender?: string;
  marketId?: AnyNumberString;
}) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchSwapEvents", sender, marketId],
    queryFn: ({ pageParam }) =>
      axiosInstance
        .get<SwapEvent[]>("/api/trades", { params: { marketId, sender, page: pageParam } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    enabled: !!sender,
  });

  return query;
};
