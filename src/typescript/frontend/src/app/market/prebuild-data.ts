import { getPrebuildFileData } from "lib/nextjs/prebuild";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";

import type { DatabaseJsonType, SymbolEmoji } from "@/sdk/index";

/**
 * Prebuild data that's used to populate static pages at build time. This removes the need for
 * up to thousands of separate fetches at build time and consolidates them into queries that return
 * multiple rows for generated static params.
 */

export const maybeGetMarketPrebuildData = (
  emojis: SymbolEmoji[]
):
  | {
      allMarketSymbols: string[];
      stateJson: DatabaseJsonType["market_state"];
      arenaInfo: DatabaseJsonType["arena_info"] | null;
      aptPrice: number | undefined;
    }
  | undefined => {
  if (!IS_NEXT_BUILD_PHASE) return undefined;

  const data = getPrebuildFileData();

  if (!data) {
    throw new Error("Couldn't find prebuild data.");
  }

  // Keep in mind that this will only throw if this market isn't found at build-time, otherwise this
  // code path should never be entered.
  if (!data.markets[emojis.join("")]) {
    throw new Error(`Couldn't find market in build data: ${emojis.join("")}`);
  }

  return {
    allMarketSymbols: Object.keys(data.markets),
    stateJson: data.markets[emojis.join("")],
    arenaInfo: data.melee_data?.melee.arena_info ?? null,
    aptPrice: data.apt_price,
  };
};
