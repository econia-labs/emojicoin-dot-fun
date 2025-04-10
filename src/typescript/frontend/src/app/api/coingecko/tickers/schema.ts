import { z } from "zod";

export const GetTickersSchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  skip: z.coerce.number().min(0).default(0),
});
