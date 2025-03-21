import { toOrderBy } from "@sdk/indexer-v2";
import { z } from "zod";

export const PaginationSchema = z.object({
  orderBy: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" }),
    })
    .optional()
    .transform((o) => (o ? toOrderBy(o) : undefined)),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("Limit must be positive")
    .max(100, "Maximum limit is 100")
    .default(100),
});
