import { OrderBySchema, PageSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { SortMarketsBy } from "@/sdk/index";

const sortByValues = [
  "delta",
  SortMarketsBy.AllTimeVolume,
  SortMarketsBy.MarketCap,
  SortMarketsBy.DailyVolume,
  SortMarketsBy.Price,
  SortMarketsBy.Tvl,
] as const;

export type StatsColumn = (typeof sortByValues)[number];

export const STATS_MARKETS_PER_PAGE = 100;

/**
 * Create the schema dynamically, based on the input max number of pages.
 *
 * This facilitates a dynamic schema that disallows page number values greater than the current
 * maximum number of pages.
 *
 * Without this, a user could poison/bloat the cache by passing extremely large page numbers.
 */
export const createStatsSchema = (totalNumberOfMarkets: number) => {
  const maxPageNumber = Math.ceil(totalNumberOfMarkets / STATS_MARKETS_PER_PAGE);

  return z.object({
    page: PageSchema.refine((val) => val <= maxPageNumber, {
      message: `Page number cannot exceed ${maxPageNumber}`,
    }),
    sortBy: z.enum(sortByValues),
    orderBy: OrderBySchema,
  });
};
