import { type DatabaseJsonType, DatabaseRpc, type PeriodTypeFromDatabase } from "../../../..";
import type { AnyNumberString } from "../../../../types/types";
import { LIMIT } from "../../../const";
import { postgrest } from "../../client";

const CHUNK_SIZE = 500;

const CACHED_CHUNKED_CANDLESTICKS_METADATA_KEY_ORDERING = [
  "transaction_version",
  "open_price",
  "high_price",
  "low_price",
  "close_price",
  "volume",
] as const;

type ChunkMetadata = {
  // Whether or not the chunk has exactly `chunk_size` items.
  complete: boolean;
  chunkID: number;
  firstStartTime: Date;
  lastStartTime: Date;
  numItems: number;
};

function toChunkMetadata(
  metadata: DatabaseJsonType["chunked_candlesticks_metadata"][],
  chunkSize: number
): ChunkMetadata[] {
  return metadata.map((m) => ({
    complete: m.num_items === chunkSize,
    chunkID: m.chunk_id,
    firstStartTime: m.first_start_time,
    lastStartTime: m.last_start_time,
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
 */
export async function fetchChunkedCandlesticksMetadata({
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

type PeriodParams = {
  to: number;
  from: number;
  countBack: number;
  firstDataRequest: boolean;
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
export function chunkedCandlestickMetadataToChunksNecessary({
  chunkSize,
  chunkedCandlesticksMetadata,
  periodParams,
}: {
  chunkSize: number;
  chunkedCandlesticksMetadata: DatabaseJsonType["chunked_candlesticks_metadata"][];
  periodParams: PeriodParams;
}) {
  // Convert the seconds-based `from` and `to` to Date objects.
  const [from, to] = [periodParams.from, periodParams.to].map((v) => new Date(v * 1000));
  const { countBack } = periodParams;

  // Throw an error if chunks aren't in ascending order.
  if (chunkedCandlesticksMetadata.length > 1) {
    const [first, second] = [
      chunkedCandlesticksMetadata[0],
      chunkedCandlesticksMetadata.at(1)!,
    ].map((c) => c.first_start_time);
    const isAscending = first.getTime() < second.getTime();
    if (!isAscending) {
      throw new Error(`Chunk dates should be in ascending order. Got: ${first} => ${second}`);
    }
  }

  // `to` will always be the latest point in time necessary to retrieve.
  // This means that the chunks fetched must *always* encapsulate `to`; that is, they must either
  // be exactly equal to or later in time than `to`.
  // First, filter out all chunks where the chunk's left time boundary is later than `to` to
  // constrict the timespan/range, because they will include irrelevant data that is discarded.
  const filtered = chunkedCandlesticksMetadata.filter(
    // Note this is `>=`, not `>`, because `to` is non-inclusive.
    (chunk) => chunk.first_start_time.getTime() >= to.getTime()
  );

  // In some cases, the `to` time might be in the middle of a chunk, meaning that the items after
  // it will eventually be discarded. However, the intra-chunk start times won't be known until the
  // chunk data is actually fetched. Thus, when calculating the chunks necessary, it's necessary
  // to be pessimistic and assume the worst case scenario; i.e., that the `to` time is the earliest
  // item in a chunk and that the other `chunkSize - 1` items will be discarded.
  // More intuitively, imagine a `countBack` of `350`, and a `chunkSize` of 500.
  // If `to` is item #200 of the last chunk (size 500), the only way to ensure that enough items are
  // returned is to retrieve two chunks, the one containing `to` and the next one.
  // This is essentially the same thing as specifying the `countBack` as `countBack + chunkSize`.
  const pessimisticCountBack = countBack + chunkSize;

  const chunks: DatabaseJsonType["chunked_candlesticks_metadata"][] = [];
  let numCandlesticks = 0;

  const hasEnoughCandlesticks = () => numCandlesticks >= pessimisticCountBack;

  while (filtered.length && !hasEnoughCandlesticks()) {
    const nextChunk = filtered.pop()!;
    // Preserve ascending order by shifting instead of pushing.
    chunks.unshift(nextChunk);
    numCandlesticks += nextChunk.num_items;
  }

  // Ensure that the earliest chunk's start time is before `from`, otherwise keep adding chunks.
  let earliestChunk = chunks.at(0);

  const firstChunkIsBeforeFromParam = () =>
    earliestChunk && earliestChunk.first_start_time.getTime() < from.getTime();

  while (filtered.length && !firstChunkIsBeforeFromParam()) {
    const nextChunk = filtered.pop()!;
    chunks.unshift(nextChunk);
    earliestChunk = chunks.at(0);
    // Not necessary due to implicit logic, but nonetheless good to be accurate.
    numCandlesticks += nextChunk.num_items;
  }

  return {
    chunks: toChunkMetadata(chunks, chunkSize),
    // Whether or not the chunk metadata spanned enough items/time to fulfill the period params.
    complete: hasEnoughCandlesticks() && firstChunkIsBeforeFromParam(),
  };
}

/**
 * The chunks returned here will be stable in terms of their `chunk_id` and the earliest and
 * latest `first_start_time`s. That is, the results can be cached permanently once the number
 * of items in a chunk is equal to the `chunk_size`.
 *
 */
export function fetchCandlestickChunks() {}
