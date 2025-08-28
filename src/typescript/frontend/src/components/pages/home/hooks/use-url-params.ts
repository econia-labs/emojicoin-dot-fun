import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { DEFAULT_SORT_BY } from "@/sdk/index";

/**
 * Note that home page url params are partially validated in middleware (all valid input strings).
 */
export const useHomePageUrlParams = () => {
  const params = useParams<{ sort?: MarketDataSortByHomePage; page?: `${number}` }>();
  return useMemo(
    () => ({
      sort: params.sort ?? DEFAULT_SORT_BY,
      page: Number(params.page ?? "1"),
    }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(params)]
  );
};
