import { toOrderBy } from "@sdk/indexer-v2";
import { z } from "zod";

export const PaginationSchema = z.object({
  orderBy: z
    .enum(["asc", "desc"])
    .optional()
    .transform((o) => (o ? toOrderBy(o) : undefined)),
  limit: z.coerce.number().max(100).default(100),
  page: z.coerce.number().default(1),
});
