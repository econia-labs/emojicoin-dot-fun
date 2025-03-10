import { ArenaPeriod } from "@sdk/const";
import { Schemas } from "@sdk/utils";
import { z } from "zod";

export const ArenaCandlesticksSearchParamsSchema = z.object({
  meleeID: Schemas["PositiveInteger"].describe("`meleeID` must be a positive integer."),
  to: Schemas["PositiveInteger"].describe("`to` must be a positive integer."),
  countBack: Schemas["PositiveInteger"].describe("`countBack` must be a positive integer."),
  period: z.nativeEnum(ArenaPeriod).describe("Invalid `period` passed."),
});

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} meleeID       - The melee ID.
 * @property {string} to            - The end time boundary.
 * @property {string} countBack     - The `countBack` value requested by the datafeed API.
 * @property {string} period        - The {@link ArenaPeriod}.
 */
export type ArenaCandlesticksSearchParams = z.infer<typeof ArenaCandlesticksSearchParamsSchema>;
