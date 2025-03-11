import { Period } from "@sdk/const";
import { Schemas } from "@sdk/utils";
import { z } from "zod";

export const CandlesticksSearchParamsSchema = z.object({
  marketID: Schemas["PositiveInteger"].describe("`marketID` must be a positive integer."),
  to: Schemas["PositiveInteger"].describe("`to` must be a positive integer."),
  countBack: Schemas["PositiveInteger"].describe("`countBack` must be a positive integer."),
  period: z.nativeEnum(Period).describe("Invalid `period` passed."),
});

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} marketID      - The market ID.
 * @property {string} to            - The end time boundary.
 * @property {string} countBack     - The `countBack` value requested by the datafeed API.
 * @property {string} period        - The {@link Period}.
 */
export type CandlesticksSearchParams = z.infer<typeof CandlesticksSearchParamsSchema>;
