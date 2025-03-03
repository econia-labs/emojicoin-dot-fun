import { type fetchSwapEvents } from "@/queries/market";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type GetTradesSchema } from "app/api/trades/route";
import { axiosInstance } from "utils/axios";
import { type z } from "zod";

export type SwapEvent = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

export const useSwapEventsQuery = (args: z.input<typeof GetTradesSchema>) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchSwapEvents", args],
    queryFn: ({ pageParam }) =>
      axiosInstance
        .get<SwapEvent[]>("/api/trades", { params: { ...args, page: pageParam } })
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    //Disable the query when neither sender nor marketId is provided
    enabled: !!args.sender || !!args.marketId,
  });

  return query;
};
