import { ROUTES } from "router/routes";

import { type OrderByStrings, toOrderByString } from "@/sdk/indexer-v2/const";

import type { StatsPageData } from "./fetches";
import type { StatsColumn } from "./schema";

export type PageSortOrder = Pick<StatsPageData, "page" | "sort" | "order">;

export const createStatsUrl = ({ page, sort, order }: PageSortOrder) =>
  !!page && !!sort && !!order
    ? `${ROUTES.stats}/${sort}/${page}/${toOrderByString(order)}` as const
    : `${ROUTES.stats}` as const;

export const toggleStatsUrl = ({
  sort,
  currSort,
  currOrder,
}: Pick<PageSortOrder, "sort"> & {
  currOrder: OrderByStrings;
  currSort: StatsColumn;
}) =>
  createStatsUrl(
    // Different sort means go back to page 1, set to "desc", but update to the new sort.
    currSort !== sort
      ? {
          sort,
          order: "desc",
          page: 1,
        }
      : // Same sort order means toggle the asc/desc value and go back to page 1.
        {
          sort,
          order: currOrder === "desc" ? "asc" : "desc",
          page: 1,
        }
  );
