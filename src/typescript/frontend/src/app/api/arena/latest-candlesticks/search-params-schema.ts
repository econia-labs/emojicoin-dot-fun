import { z } from "zod";

import { Schemas } from "@/sdk/utils";

export const LatestArenaCandlesticksSearchParamsSchema = z.object({
  meleeID: Schemas["PositiveInteger"].describe("`meleeID` must be a positive integer."),
});

/**
 * The search params used in the `GET` request at `/api/arena/latest-candlesticks`.
 *
 * @property {string} meleeID       - A number string, as the melee ID.
 */
export type LatestArenaCandlesticksSearchParams = z.infer<
  typeof LatestArenaCandlesticksSearchParamsSchema
>;
