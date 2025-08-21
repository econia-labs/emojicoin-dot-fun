import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { SortMarketsBy } from "@/sdk/index";
import { Schemas } from "@/sdk/utils";

export const SearchSchema = PaginationSchema.extend({
  sortBy: z.enum([
    SortMarketsBy.BumpOrder,
    SortMarketsBy.AllTimeVolume,
    SortMarketsBy.DailyVolume,
    SortMarketsBy.MarketCap,
  ]),
  searchBytes: Schemas.SymbolEmojis.optional(),
});
