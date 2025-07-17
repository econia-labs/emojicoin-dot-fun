import { z } from "zod";

import { Period } from "@/sdk/const";

/**
 * 4h and 1d candlesticks are not even indexed for arena candlesticks.
 *
 * 15s candlesticks are indexed but disabled.
 */
export const SupportedPeriodSchemaArena = z
  .enum([Period.Period1M, Period.Period5M, Period.Period15M, Period.Period30M, Period.Period1H])
  .describe("Invalid arena period passed.");
