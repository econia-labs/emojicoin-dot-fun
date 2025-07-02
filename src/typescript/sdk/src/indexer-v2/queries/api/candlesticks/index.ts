import { type DatabaseJsonType, DatabaseRpc, type PeriodTypeFromDatabase } from "../../../..";
import type { AnyNumberString } from "../../../../types/types";
import { LIMIT } from "../../../const";
import { postgrest } from "../../client";

const CACHED_CHUNKED_CANDLESTICKS_METADATA_KEY_ORDERING = [
  "transaction_version",
  "open_price",
  "high_price",
  "low_price",
  "close_price",
  "volume",
] as const;

export type ChunkMetadata = {
  // Whether or not the chunk has exactly `chunk_size` items.
  complete: boolean;
  chunkID: number;
  firstStartTime: Date;
  lastStartTime: Date;
  numItems: number;
};

export function toChunkMetadata(
  metadata: DatabaseJsonType["chunked_candlesticks_metadata"][],
  chunkSize: number
): ChunkMetadata[] {
  return metadata.map((m) => ({
    complete: m.num_items === chunkSize,
    chunkID: m.chunk_id,
    firstStartTime:
      typeof m.first_start_time === "string" ? new Date(m.first_start_time) : m.first_start_time,
    lastStartTime:
      typeof m.last_start_time === "string" ? new Date(m.last_start_time) : m.last_start_time,
    numItems: m.num_items,
  }));
}

/**
 * The candlesticks caching mechanism works by grouping candlesticks into chunks when storing them
 * into the intermediate cache. With regards to the frontend, this is the `unstable_cache` cache.
 *
 * This facilitates permanently caching historical candlesticks when there are enough to fill a
 * chunk of candlesticks.
 *
 * The cached chunks must facilitate efficient storage retrieval; that is, there needs to
 * be a way to only return the minimum amount of chunks necessary to populate the data for all bars
 * between `from` and `to`, with at minimum `countBack` bars.
 *
 * The chunking mechanism itself requires no extra logic; however, the caller must know prior to
 * fetching *which chunks of candlestick data to retrieve.*
 *
 * This data is retrieved through the `chunked_candlesticks_metadata` postgres function, which is
 * then used by the caller to fetch specific chunks of data.
 *
 * This data is then stored efficiently as chunks in the `unstable_cache` cache.
 *
 * Returns up to `LIMIT` rows.
 */
async function fetchChunkedCandlesticksMetadata({
  marketID,
  period,
  chunkSize,
  page = 1,
}: {
  marketID: AnyNumberString;
  period: PeriodTypeFromDatabase;
  chunkSize: number;
  page?: number;
}) {
  return await postgrest
    .dbRpc(
      DatabaseRpc.ChunkedCandlesticksMetadata,
      {
        market_id: marketID,
        period,
        chunk_size: chunkSize,
      },
      { get: true }
    )
    .select("*")
    .limit(LIMIT)
    .range((page - 1) * LIMIT, page * LIMIT - 1)
    .overrideTypes<DatabaseJsonType["chunked_candlesticks_metadata"][], { merge: false }>();
}

export async function fetchAllChunkedCandlesticksMetadata({
  marketID,
  period,
  chunkSize,
}: {
  marketID: AnyNumberString;
  period: PeriodTypeFromDatabase;
  chunkSize: number;
}) {
  const chunks: DatabaseJsonType["chunked_candlesticks_metadata"][] = [];
  let lastRes: DatabaseJsonType["chunked_candlesticks_metadata"][] = [];
  let page = 1;

  // Exhaustively fetch all chunks. This repeatedly fetches while the most recent fetched data
  // doesn't have `LIMIT` # of rows.
  do {
    lastRes =
      (await fetchChunkedCandlesticksMetadata({ marketID, period, chunkSize, page })).data ?? [];
    page += 1;
    chunks.push(...lastRes);
  } while (lastRes.length % LIMIT === 0);

  return chunks;
}

type ToAndCountBack = {
  to: number;
  countBack: number;
};

/**
 * Convert the chunked candlestick metadata + the datafeed library's period params to just the
 * chunks that are necessary to fetch. This is essentially providing the query params for the
 * chunk fetches.
 *
 * The typical data access pattern will be the data requested by the TradingView datafeed API's
 * `getBars` function. The specific requirements for what's returned is explained
 * [here](https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/#getbars).
 *
 * The basic stipulations relevant to the cached candlestick data are:
 *   1. Always return at least `countBack` bars. If there are more bars than what's in the range,
 *      return more bars from further back in time until there are `countBack` bars.
 *   2. Always return all existing data for the requested range.
 *
 * The datafeed API will request at least `countBack` bars beginning at an arbitrary point in time
 * `to` and expect the data to flow backwards; i.e., the latest bar will always be the `to`
 * timestamp.
 *
 * @param chunkSize the chunk size
 * @param chunkedCandlesticksMetadata the response from the indexer containing all of the chunk
 * metadata
 * @param periodParams the period params from the datafeed API
 */
export function getOnlyRelevantChunks({
  expectedChunkSize,
  chunkMetadata,
  toAndCountBack,
}: {
  expectedChunkSize: number;
  chunkMetadata: ChunkMetadata[];
  toAndCountBack: ToAndCountBack;
}) {
  // Convert the seconds-based param to a Date object.
  const to = new Date(toAndCountBack.to * 1000);

  if (chunkMetadata.length > 1) {
    const [first, second] = [chunkMetadata[0], chunkMetadata.at(1)!].map((c) => c.firstStartTime);
    const isAscending = first.getTime() < second.getTime();
    if (!isAscending) {
      throw new Error(`Chunk dates should be in ascending order. Got: ${first} => ${second}`);
    }
    const someRowsHaveIncorrectLength = chunkMetadata.some(
      (row, i) => i !== chunkMetadata.length - 1 && row.numItems !== expectedChunkSize
    );
    if (someRowsHaveIncorrectLength) {
      const lengths = chunkMetadata.map((row) => row.numItems);
      const msg = "Only the last item in the chunk metadata should have a non-`chunkSize` length.";
      const fullMessage = `${msg} Lengths: ${lengths}`;
      if (process.env.NODE_ENV === "development") {
        throw new Error(fullMessage);
      } else {
        console.error(fullMessage);
      }
    }
  }

  // `to` will always be the latest point in time necessary to retrieve.
  // This means that the chunks fetched must *always* encapsulate `to`; that is, they must either
  // be exactly equal to or earlier in time than `to`.
  return chunkMetadata.filter(
    // Filter out all chunks where the chunk's left time boundary is later than `to` to
    // constrict the time span/range, because they will include irrelevant data that is discarded.
    // Note this is `>=`, not `>`, because `to` is non-inclusive.
    (chunk) => !(chunk.firstStartTime.getTime() >= to.getTime())
  );
}
