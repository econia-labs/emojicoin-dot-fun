import { AccountAddress } from "@aptos-labs/ts-sdk";
import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

import { SortMarketsBy } from "@/sdk/index";
import { Schemas } from "@/sdk/utils";

export const GetPoolsSchema = PaginationSchema.extend({
  sortBy: z.nativeEnum(SortMarketsBy).default(SortMarketsBy.Apr),
  searchBytes: Schemas.SymbolEmojis.optional(),
  account: Schemas.AccountAddress.transform((val) => AccountAddress.from(val)).optional(),
});
