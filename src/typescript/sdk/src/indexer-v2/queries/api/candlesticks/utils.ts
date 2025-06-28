import type {
  CachedChunkedCandlesticks,
  DatabaseJsonType,
  PeriodTypeFromDatabase,
} from "../../../types/json-types";

export function toCachedChunkedCandlesticks({
  marketID,
  period,
  data,
  key_ordering,
  strict = false,
}: {
  marketID: string;
  period: PeriodTypeFromDatabase;
  data: DatabaseJsonType["candlesticks"][];
  key_ordering: (keyof DatabaseJsonType["candlesticks"])[];
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
          key_ordering.every((k) => k in d)
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
      key_ordering,
    },
    rows: data.map((d) => key_ordering.map((k) => d[k])),
  };
}
