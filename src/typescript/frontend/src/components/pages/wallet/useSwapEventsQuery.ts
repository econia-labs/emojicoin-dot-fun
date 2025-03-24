import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetTradesSchema } from "app/api/trades/schema";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

import type { fetchSwapEvents } from "@/queries/market";
import { LIMIT } from "@/sdk/indexer-v2/const";

export type SwapEvent = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

export const useSwapEventsQuery = (args: z.input<typeof GetTradesSchema>, disabled?: boolean) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchSwapEvents", args],
    queryFn: ({ pageParam }) =>
      fetch(addSearchParams(ROUTES.api.trades, { ...args, page: pageParam })).then(async (r) => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP error ${r.status}: ${errorText}`);
        }
        return parseJSON<SwapEvent[]>(await r.text());
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPageResponse, allPageResponses) =>
      lastPageResponse?.length === LIMIT ? allPageResponses.length + 1 : undefined,
    // Disable the query when neither sender nor marketID is provided
    enabled: !disabled && (!!args.sender || !!args.marketID),
  });

  return query;
};
