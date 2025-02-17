if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { type SymbolEmoji } from "../../../emoji_data";
import { chunk } from "../../../utils/misc";
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
export const joinEqClauses = (symbols: SymbolEmoji[][]) => symbols.map(toEqClause).join(",");

/**
 * @see fetchSpecificMarkets for why this function on its own is potentially unsafe/incorrect.
 */
const fetchSpecificMarketsUnsafe = async (symbols: SymbolEmoji[][]) =>
  await postgrest
    .from(TableName.MarketState)
    .select("*")
    .or(joinEqClauses(symbols))
    .then((res) => res.data ?? [])
    .then((res) => res.map(toMarketStateModel));

const MAX_SYMBOLS_PER_FETCH = 100;

/* eslint-disable import/no-unused-modules */
/**
 * NOTE: These markets are returned unsorted since they can be sorted post-fetch.
 *
 * NOTE: Due to limitations with the postgrest API, it's possible that an incorrect query value is
 * silently returned once the request URL exceed ~10-11,000 bytes.
 *
 * To avoid encountering silently incorrect query results, this function automatically paginates
 * once the input symbol length exceeds 100.
 *
 * @see {@link toEqClause}
 * @see {@link joinEqClauses}
 * @param symbols the market symbols to filter on
 * @returns the *unsorted* market state data for the market symbols passed in
 */
export const fetchSpecificMarkets = async (symbols: SymbolEmoji[][]) => {
  // Log a console warning to note automatic pagination.
  if (symbols.length > MAX_SYMBOLS_PER_FETCH) {
    console.warn(`More than ${MAX_SYMBOLS_PER_FETCH} symbols were passed to fetchSpecificMarkets.`);
  }
  // Since the symbols are chunked, it's necessary to deduplicate input elements to avoid
  // erroneously returning multiple of the same row from different chunks.
  const mapped = new Map(symbols.map((symbol) => [symbol.join(""), symbol]));
  const deduped = Array.from(mapped.values());
  const chunks = chunk(deduped, MAX_SYMBOLS_PER_FETCH);
  const promises = chunks.map((arr) => fetchSpecificMarketsUnsafe(arr));
  const flattened = (await Promise.all(promises)).flat();
  return flattened;
};
