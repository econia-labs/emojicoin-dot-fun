import { z } from "zod";

import { Period } from "@/sdk/index";
import { Schemas } from "@/sdk/utils";

export const ArenaCandlesticksSearchParamsSchema = z.object({
  meleeID: Schemas["PositiveInteger"].describe("`meleeID` must be a positive integer."),
  to: Schemas["PositiveInteger"].describe("`to` must be a positive integer."),
  countBack: Schemas["PositiveInteger"].describe("`countBack` must be a positive integer."),
  period: z.nativeEnum(Period).describe("Invalid `period` passed."),
});

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} meleeID       - A number string, as the melee ID.
 * @property {string} to            - A number string, as the end time boundary as a UNIX timestamp.
 * @property {string} countBack     - A number string, as `countBack` requested by the datafeed API.
 * @property {string} period        - A string representing the {@link Period}
 */
export type ArenaCandlesticksSearchParams = z.infer<typeof ArenaCandlesticksSearchParamsSchema>;
