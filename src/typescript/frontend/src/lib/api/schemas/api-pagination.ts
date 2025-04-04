import { z } from "zod";

import { toOrderBy } from "@/sdk/indexer-v2";

export const OrderBySchema = z
  .enum(["asc", "desc"], {
    errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" }),
  })
  .default("desc")
  .transform((o) => toOrderBy(o));

export const PageSchema = z.coerce.number().int().min(1, "Page must be at least 1").default(1);

export const PaginationSchema = z.object({
  orderBy: OrderBySchema,
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("Limit must be positive")
    .max(100, "Maximum limit is 100")
    .default(100),
});
