import type fetchAggregateMarkets from "./initial/aggregate-markets";

type AggregateMarketMetadata = Awaited<ReturnType<typeof fetchAggregateMarkets>>["markets"];
export type DetailedMarketMetadata = AggregateMarketMetadata[number];
