import { SupportedPeriodSchema } from "app/api/candlesticks/supported-period-schema";
import { z } from "zod";

import { Schemas } from "@/sdk/utils";

export const ArenaCandlesticksSearchParamsSchema = z.object({
  meleeID: Schemas["PositiveInteger"].describe("`meleeID` must be a positive integer."),
  to: Schemas["PositiveInteger"].describe("`to` must be a positive integer."),
  countBack: Schemas["PositiveInteger"].describe("`countBack` must be a positive integer."),
  period: SupportedPeriodSchema,
});

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} meleeID       - A number string, as the melee ID.
 * @property {string} to            - A number string, as the end time boundary as a UNIX timestamp.
 * @property {string} countBack     - A number string, as `countBack` requested by the datafeed API.
 * @property {string} period        - A string representing the {@link SupportedPeriodSchema}
 */
export type ArenaCandlesticksSearchParams = z.infer<typeof ArenaCandlesticksSearchParamsSchema>;
