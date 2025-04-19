import { useQuery } from "@tanstack/react-query";
import type { GetPoolsSchema } from "app/api/pools/schema";
import type { PoolsData } from "app/pools/page";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

export const usePoolData = (args: z.input<typeof GetPoolsSchema>, initialData?: PoolsData[]) => {
  const query = useQuery({
    queryKey: ["usePoolData", args],
    queryFn: () =>
      fetch(addSearchParams(ROUTES.api.pools, { ...args })).then(async (r) => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP error ${r.status}: ${errorText}`);
        }
        return parseJSON<PoolsData[]>(await r.text());
      }),
    initialData: initialData || [],
  });

  return query;
};
