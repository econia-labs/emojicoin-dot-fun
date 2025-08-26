import { OrderBySchema, PageSchema } from "lib/api/schemas/api-pagination";
import getMaxPageNumber from "lib/utils/get-max-page-number";
import { z } from "zod";

import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

export const statsSortByValues = [
  "delta",
  SortMarketsBy.AllTimeVolume,
  SortMarketsBy.MarketCap,
  SortMarketsBy.DailyVolume,
  SortMarketsBy.Price,
  SortMarketsBy.Tvl,
] as const;

export type StatsColumn = (typeof statsSortByValues)[number];
export type StatsSchemaInput = Omit<z.input<ReturnType<typeof createStatsSchema>>, "page"> & {
  page?: string | number | undefined;
};
export type StatsSchemaOutput = z.infer<ReturnType<typeof createStatsSchema>>;

export const STATS_MARKETS_PER_PAGE = 100;

export const DEFAULT_STATS_SORT_BY = SortMarketsBy.DailyVolume;

/**
 * Create the schema dynamically, based on the input max number of pages.
 *
 * This facilitates a dynamic schema that disallows page number values greater than the current
 * maximum number of pages.
 *
 * Without this, a user could poison/bloat the cache by passing extremely large page numbers.
 */
export const createStatsSchema = (totalNumberOfMarkets: number) => {
  const maxPageNumber = getMaxPageNumber(totalNumberOfMarkets, STATS_MARKETS_PER_PAGE);

  return z.object({
    page: PageSchema.refine((val) => val <= maxPageNumber, {
      message: `Page number cannot exceed ${maxPageNumber}`,
    }),
    sort: z.enum(statsSortByValues).default(DEFAULT_STATS_SORT_BY),
    order: OrderBySchema,
  });
};
