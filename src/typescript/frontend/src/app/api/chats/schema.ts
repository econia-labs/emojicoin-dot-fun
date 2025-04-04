import { PaginationSchema } from "lib/api/schemas/api-pagination";
import { z } from "zod";

export const GetChatsSchema = PaginationSchema.extend({
  marketID: z.string().or(z.array(z.string())),
});
