import type {
  CachedChunkedCandlesticks,
  DatabaseJsonType,
  PeriodTypeFromDatabase,
} from "../../../types/json-types";

const CACHED_CANDLESTICKS_KEYS_ORDER: (keyof DatabaseJsonType["candlesticks"])[] = [
  "last_transaction_version",
  "open_price",
  "high_price",
  "low_price",
  "close_price",
  "volume",
];

export function toCachedChunkedCandlesticks({
  marketID,
  period,
  data,
  strict = false,
}: {
  marketID: string;
  period: PeriodTypeFromDatabase;
  data: DatabaseJsonType["candlesticks"][];
  strict?: boolean;
}): CachedChunkedCandlesticks | null {
  if (!data.length) return null;

  const { market_id, symbol_emojis } = data[0];

  // This should only be used in tests or to debug, since there's a lot of comparisons here.
  if (strict) {
    if (
      !data.every(
        (d) =>
          d.market_id === marketID &&
          d.symbol_emojis.join("") === symbol_emojis.join("") &&
          d.period === period &&
          CACHED_CANDLESTICKS_KEYS_ORDER.every((k) => k in d)
      )
    ) {
      throw new Error(
        "Candlestick rows aren't homogenous. Market id, symbol emojis, and period must be constant."
      );
    }
  }

  return {
    metadata: {
      market_id,
      symbol_emojis,
      period,
      key_ordering: CACHED_CANDLESTICKS_KEYS_ORDER,
    },
    rows: data.map((d) => CACHED_CANDLESTICKS_KEYS_ORDER.map((k) => d[k])),
  };
}

export function fromCachedChunkedCandlesticks(
  cachedData: ReturnType<typeof toCachedChunkedCandlesticks>
) {
  if (!cachedData) return [];
  const { metadata, rows } = cachedData;
  const { market_id, period, symbol_emojis } = metadata;
  // Explode the array of arrays into an array of objects/rows.
  return rows.map((row) =>
    Object.fromEntries([
      ["market_id", market_id],
      ["period", period],
      ["symbol_emojis", symbol_emojis],
      ...metadata.key_ordering.map((key, i) => [key, row[i]] as const),
    ])
  );
}
