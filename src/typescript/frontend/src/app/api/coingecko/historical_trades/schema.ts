import { z } from "zod";

export const GetHistoricalTradesSchema = z.object({
  ticker_id: z.string().optional(),
  type: z.enum(["buy", "sell"]).optional(),
  start_time: z.coerce.number().int().min(0).optional(),
  end_time: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().min(1).max(500).default(500),
  skip: z.coerce.number().min(0).default(0),
});
