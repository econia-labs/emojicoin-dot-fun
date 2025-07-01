import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetPoolsSchema } from "app/api/pools/schema";
import type { PoolsData } from "app/pools/page";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { ROUTES } from "router/routes";
import { parseResponseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

export const usePoolData = (args: z.input<typeof GetPoolsSchema>) => {
  const query = useInfiniteQuery({
    queryKey: ["usePoolData", args],
    queryFn: ({ pageParam }) =>
      fetch(addSearchParams(ROUTES.api.pools, { ...args, page: pageParam })).then(async (r) => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP error ${r.status}: ${errorText}`);
        }
        return parseResponseJSON<PoolsData[]>(await r.text());
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPageResponse, allPageResponses) =>
      lastPageResponse?.length === MARKETS_PER_PAGE ? allPageResponses.length + 1 : undefined,
    staleTime: 10000, // 10 seconds
  });

  return query;
};
