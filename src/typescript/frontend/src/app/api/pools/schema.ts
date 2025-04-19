import { OrderBySchema, PageSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { SortMarketsBy } from "@/sdk/index";
import { Schemas } from "@/sdk/utils";

export const GetPoolsSchema = z.object({
  page: PageSchema,
  sortBy: z.nativeEnum(SortMarketsBy).default(SortMarketsBy.Apr),
  orderBy: OrderBySchema,
  searchBytes: Schemas.SymbolEmojis.optional(),
  account: Schemas.AccountAddress.optional(),
});
