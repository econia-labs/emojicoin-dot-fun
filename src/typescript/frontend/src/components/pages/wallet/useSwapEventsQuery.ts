import { type fetchSwapEvents } from "@/queries/market";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type GetTradesSchema } from "app/api/trades/schema";
import { ecFetch } from "lib/ecFetch/ecFetch";
import { ROUTES } from "router/routes";
import { type z } from "zod";

export type SwapEvent = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

export const useSwapEventsQuery = (args: z.input<typeof GetTradesSchema>, disabled?: boolean) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchSwapEvents", args],
    queryFn: ({ pageParam }) =>
      ecFetch<SwapEvent[]>(ROUTES.api.trades, {
        method: "GET",
        searchParams: { ...args, page: pageParam },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    //Disable the query when neither sender nor marketID is provided
    enabled: !disabled && (!!args.sender || !!args.marketID),
  });

  return query;
};
