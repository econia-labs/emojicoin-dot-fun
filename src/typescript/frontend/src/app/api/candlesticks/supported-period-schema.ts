import { z } from "zod";

import { Period } from "@/sdk/const";

export const SupportedPeriodSchema = z
  .enum([
    Period.Period1M,
    Period.Period5M,
    Period.Period15M,
    Period.Period30M,
    Period.Period1H,
    Period.Period4H,
    Period.Period1D,
  ])
  .describe("Invalid period passed.");
