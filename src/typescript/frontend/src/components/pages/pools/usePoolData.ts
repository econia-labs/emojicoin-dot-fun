import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetPoolsSchema } from "app/api/pools/schema";
import type { PoolsData } from "app/pools/page";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

import { LIMIT } from "@/sdk/indexer-v2/const";

export const usePoolData = (args: z.input<typeof GetPoolsSchema>) => {
  const query = useInfiniteQuery({
    queryKey: ["usePoolData", args],
    queryFn: ({ pageParam }) =>
      fetch(addSearchParams(ROUTES.api.pools, { ...args, page: pageParam })).then(async (r) => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP error ${r.status}: ${errorText}`);
        }
        return parseJSON<PoolsData[]>(await r.text());
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPageResponse, allPageResponses) =>
      lastPageResponse?.length === LIMIT ? allPageResponses.length + 1 : undefined,
  });

  return query;
};
