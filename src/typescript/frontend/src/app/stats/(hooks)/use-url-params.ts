import { useParams } from "next/navigation";
import { useMemo } from "react";

import type { OrderByStrings } from "@/sdk/indexer-v2/const";

import type { StatsPageData } from "../(utils)/fetches";
import type { StatsColumn } from "../(utils)/schema";
import { DEFAULT_STATS_SORT_BY } from "../(utils)/schema";

export const useStatsUrlParams = (): Pick<StatsPageData, "page" | "sort" | "order"> => {
  const params = useParams<{ sort?: StatsColumn; order?: OrderByStrings; page?: string }>();
  return useMemo(
    () => ({
      sort: params.sort ?? DEFAULT_STATS_SORT_BY,
      order: params.order ?? "desc",
      page: Number(params.page ?? "1"),
    }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [JSON.stringify(params)]
  );
};
