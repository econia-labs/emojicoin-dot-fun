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
export type StatsSchemaInput = z.input<ReturnType<typeof createStatsSchema>>;
export type StatsSchemaOutput = z.infer<ReturnType<typeof createStatsSchema>>;

export const STATS_MARKETS_PER_PAGE = 100;

export const getMaxStatsPageNumber = (totalNumberOfMarkets: number) =>
  Math.ceil(totalNumberOfMarkets / STATS_MARKETS_PER_PAGE);

/**
 * Create the schema dynamically, based on the input max number of pages.
 *
 * This facilitates a dynamic schema that disallows page number values greater than the current
 * maximum number of pages.
 *
 * Without this, a user could poison/bloat the cache by passing extremely large page numbers.
 */
export const createStatsSchema = (totalNumberOfMarkets: number) => {
  const maxPageNumber = getMaxStatsPageNumber(totalNumberOfMarkets);

  return z.object({
    page: PageSchema.refine((val) => val <= maxPageNumber, {
      message: `Page number cannot exceed ${maxPageNumber}`,
    }),
    sortBy: z.enum(sortByValues).default(SortMarketsBy.DailyVolume),
    orderBy: OrderBySchema,
  });
};
