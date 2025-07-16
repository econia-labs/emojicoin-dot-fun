import "server-only";

import { unstable_cache } from "next/cache";
import type { z } from "zod";

import type { DatabaseJsonType } from "@/sdk/index";
import { Period, PERIODS_IN_ONE_DAY, TableName } from "@/sdk/index";
import { MAX_ROW_LIMIT, ORDER_BY, postgrest } from "@/sdk/indexer-v2";
import type { AnyNumberString } from "@/sdk-types";

import type { SupportedPeriodSchemaArena } from "./supported-period-schema";

// -------------------------------------------------------------------------------------------------
// NOTE:
// The explanations below are all based on the fact that the arena duration is less than one day.
// If the arena duration is ever more than 24 hours, this endpoint will just not return all
// candlesticks.
// -------------------------------------------------------------------------------------------------

// Quick sanity check at build time.
if (Math.ceil(PERIODS_IN_ONE_DAY[Period.Period1M] / MAX_ROW_LIMIT) > 3) {
  throw new Error("The caching function wasn't designed to make more than three fetches.");
}

// Since 15 second periods are no longer supported, this should only ever return a max of 1440
// rows for the 1m time frame. The next highest would be 5 minutes at < 500 rows.
// Thus, just cache all rows for each period, and let the API endpoint figure out what specific
// data to return based on the request params.
const fetchCachedArenaCandlesticks = unstable_cache(
  async ({
    meleeID,
    period,
  }: {
    meleeID: AnyNumberString;
    period: z.infer<typeof SupportedPeriodSchemaArena>;
  }) => {
    const maxNumCandlesticks = PERIODS_IN_ONE_DAY[period];
    // Put a hard cap on the number of fetches to do.
    const maxNumFetches = Math.ceil(maxNumCandlesticks / MAX_ROW_LIMIT);

    let i = 0;
    const res: DatabaseJsonType["arena_candlesticks"][] = [];
    while (i < maxNumFetches) {
      const next = await postgrest
        .from(TableName.ArenaCandlesticks)
        .select("*")
        .eq("melee_id", meleeID.toString())
        .eq("period", period)
        .limit(MAX_ROW_LIMIT)
        .order("start_time", ORDER_BY.ASC)
        .overrideTypes<DatabaseJsonType["arena_candlesticks"][]>()
        .then((res) => res.data ?? []);

      res.unshift(...next); // Unshift because it's in ascending order.
      i += 1;
      if (next.length !== MAX_ROW_LIMIT) break;
    }

    return res;
  },
  [],
  {
    revalidate: 10,
    tags: ["fetch-cached-arena-candlesticks"],
  }
);

export default fetchCachedArenaCandlesticks;
