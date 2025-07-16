import { z } from "zod";

import { Schemas } from "@/sdk/utils";

export const LatestCandlesticksSearchParamsSchema = z.object({
  marketID: Schemas["PositiveInteger"].describe("`marketID` must be a positive integer."),
});

/**
 * The search params used in the `GET` request at `/api/latest-candlesticks`.
 *
 * @property {string} marketID      - A number string, as the market ID.
 */
export type LatestCandlesticksSearchParams = z.infer<typeof LatestCandlesticksSearchParamsSchema>;
