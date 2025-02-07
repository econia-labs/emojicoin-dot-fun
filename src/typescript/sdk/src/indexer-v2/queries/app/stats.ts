if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { type SymbolEmoji } from "../../../emoji_data";
import { compareNumber } from "../../../utils";
import { TableName, toMarketStateModel } from "../../types";
import { postgrest } from "../client";

/**
 * Based off this working postgrest syntax:
 * .eq('symbol_emojis.eq.{"👀","👀"}');
 *
 * @param emojis ["👀", "👀"]
 * @returns symbol_emojis.eq.{"👀","👀"}
 */
const toEqClause = (emojis: SymbolEmoji[]) => `symbol_emojis.eq.{"${emojis.join('","')}"}`;

/**
 * Map an array of symbol emojis representing the separated symbol emojis for a market symbol to the
 * proper `eq.(...)` clause in postgrest.
 *
 * @param symbols [["👀","👀"], ["💀"], ["🎲"]]
 * @returns symbol_emojis.eq.{"👀","👀"},symbol_emojis.eq.{"💀"},symbol_emojis.eq.{"🎲"}
 */
const joinEqClauses = (symbols: SymbolEmoji[][]) => symbols.map(toEqClause).join(",");

/* eslint-disable import/no-unused-modules */
/**
 * NOTE: These markets are returned *unsorted*.
 *
 * @see {@link toEqClause}
 * @see {@link joinEqClauses}
 * @param symbols the market symbols to filter on
 * @returns the *unsorted* market state data for the market symbols passed in
 */
export const fetchSpecificMarkets = async (symbols: SymbolEmoji[][]) =>
  await postgrest
    .from(TableName.MarketState)
    .select("*")
    .or(joinEqClauses(symbols))
    .then((res) => res.data ?? [])
    .then((res) => res.map(toMarketStateModel));

/**
 * Given an exhaustive list of price deltas for all markets, sort them based on query params.
 */
export const manuallyPaginatePriceDeltas = ({
  priceDeltas,
  page,
  pageSize,
  desc,
}: {
  priceDeltas: { [symbol: string]: number };
  page: number;
  pageSize: number;
  desc: boolean;
}): [string, number][] => {
  const [start, end] = [(page - 1) * pageSize, page * pageSize];
  const entries = Object.entries(priceDeltas);
  const sortedAsc = entries.sort(([_, d1], [__, d2]) => compareNumber(d1, d2));
  const sorted = desc ? sortedAsc.toReversed() : sortedAsc;
  return sorted.slice(start, end);
};
/* eslint-enable import/no-unused-modules */
