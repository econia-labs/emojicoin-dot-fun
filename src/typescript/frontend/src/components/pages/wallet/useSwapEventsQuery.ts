import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetTradesSchema } from "app/api/trades/schema";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

import type { fetchSwapEvents } from "@/queries/market";
import { LIMIT } from "@/sdk/indexer-v2/const";

export type SwapEvent = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

const TEN_SECONDS = 10000;

export const useSwapEventsQuery = (
  args: z.input<typeof GetTradesSchema>,
  options?: {
    disabled?: boolean;
    /**
     * Additional query key to differentiate between multiple instances of this query with the same arguments.
     * This prevents cached data from being shared between queries when they have different enabled states.
     * Without this, if two queries with the same args exist on the same page where one is enabled and one is disabled,
     * the disabled query would still get data from the cache of the enabled query.
     */
    queryKey?: string;
  }
) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchSwapEvents", args, options?.queryKey],
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
    // Disable the query when explicitly disabled or when neither sender nor marketID is provided
    enabled: options?.disabled !== true && (!!args.sender || !!args.marketID),
    staleTime: TEN_SECONDS,
  });

  return query;
};
