import { MAX_CANDLESTICK_COUNT_BACK } from "const";
import { z } from "zod";

import { Schemas } from "@/sdk/utils";

import { SupportedPeriodSchema } from "./supported-period-schema";

export const CandlesticksSearchParamsSchema = z.object({
  marketID: Schemas["PositiveInteger"].describe("`marketID` must be a positive integer."),
  to: Schemas["PositiveInteger"].describe("`to` must be a positive integer."),
  countBack: Schemas["PositiveInteger"]
    .refine((v) => v <= MAX_CANDLESTICK_COUNT_BACK)
    .describe(
      `\`countBack\` must be a positive integer and less than ${MAX_CANDLESTICK_COUNT_BACK}`
    ),
  period: SupportedPeriodSchema,
});

/**
 * The search params used in the `GET` request at `/api/candlesticks`.
 *
 * @property {string} marketID      - A number string, as the market ID.
 * @property {string} to            - A number string, as the end time boundary as a UNIX timestamp.
 * @property {string} countBack     - A number string, as `countBack` requested by the datafeed API.
 * @property {string} period        - A string representing the {@link SupportedPeriodSchema}
 */
export type CandlesticksSearchParams = z.infer<typeof CandlesticksSearchParamsSchema>;
