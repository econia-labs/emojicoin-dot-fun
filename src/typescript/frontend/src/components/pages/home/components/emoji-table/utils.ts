import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { isStateEvent, type Types } from "@sdk/types/types";
import { type EventStore } from "@store/event-store";
import { type FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { type TableCardProps } from "../table-card/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type EmojiPickerStore } from "@store/emoji-picker-store";

export type PropsWithTime = Omit<TableCardProps, "index" | "itemsPerLine"> & {
  key: string;
  time: number;
};
export type PropsWithTimeAndIndex = TableCardProps & { key: string; time: number };
export type WithTimeIndexAndPrev = PropsWithTimeAndIndex & {
  prevIndex?: number;
  prevKey?: string;
};

export const marketDataToProps = (data: FetchSortedMarketDataReturn["markets"]): PropsWithTime[] =>
  data.map((market) => ({
    key: market.symbol,
    time: market.bumpTime,
    symbol: market.symbol,
    marketID: market.marketID,
    emojis: market.emojis,
    staticMarketCap: market.marketCap.toString(),
    staticVolume24H: market.dailyVolume.toString(),
    staticNumSwaps: market.numSwaps.toString(),
  }));

export const stateEventsToProps = (
  firehose: EventStore["firehose"],
  getMarket: EventStore["getMarket"]
): PropsWithTime[] => {
  // State events are emitted with every single event related to bump order.
  // We can strictly only use state events to get the information we need to construct the bump
  // order data visually.
  const stateEvents = firehose.filter(isStateEvent) as Array<Types.StateEvent>;
  return stateEvents.map((e) => {
    const marketID = Number(e.marketID);
    const marketCap = getMarket(marketID)?.marketData?.marketCap;
    const volume24H = getMarket(marketID)?.marketData?.dailyVolume;
    const numSwaps = getMarket(marketID)?.marketData?.numSwaps;
    const emojiData = symbolBytesToEmojis(e.marketMetadata.emojiBytes);
    const { symbol, emojis } = emojiData;
    return {
      key: symbol,
      time: Number(e.stateMetadata.bumpTime),
      symbol,
      emojis,
      marketID: Number(marketID),
      staticMarketCap: (marketCap ?? 0).toString(),
      staticVolume24H: (volume24H ?? 0).toString(),
      staticNumSwaps: (numSwaps ?? 0).toString(),
    };
  });
};

export const deduplicateEventsByMarketID = (
  aggregate: PropsWithTime[]
): (PropsWithTime & { index: number })[] => {
  const marketIDs = new Set<number>();
  return aggregate.reduce(
    (acc, val) => {
      if (!marketIDs.has(val.marketID)) {
        acc.push({
          ...val,
          index: acc.length + 1,
        });
        marketIDs.add(val.marketID);
      }
      return acc;
    },
    [] as (PropsWithTime & { index: number })[]
  );
};

// Sorts by time. This is specifically for the bump order sorting and deduplication.
export const deduplicateAndSortEvents = (
  initial: PropsWithTime[],
  appended: PropsWithTime[]
): (PropsWithTime & { index: number })[] => {
  const aggregate = [...initial, ...appended];
  aggregate.sort((a, b) => b.time - a.time);
  return deduplicateEventsByMarketID(aggregate);
};

export const constructOrdered = ({
  data,
  stateFirehose,
  getMarket,
  getSearchEmojis = () => [],
}: {
  data: FetchSortedMarketDataReturn["markets"];
  stateFirehose: EventStore["stateFirehose"];
  getMarket: EventStore["getMarket"];
  getSearchEmojis?: EmojiPickerStore["getEmojis"];
}) => {
  // We don't need to filter because the data passed in is already filtered from the server
  // component prop data.
  const searchEmojis = getSearchEmojis();
  const initial = marketDataToProps(data).map((v, i) => ({ ...v, index: i }));

  // If we're sorting by bump order, deduplicate and sort the events by bump order.
  const bumps = stateEventsToProps(stateFirehose, getMarket);
  // Filter only if there are search emojis.
  const filteredBumps = !searchEmojis.length
    ? bumps
    : bumps.filter((bump) => searchEmojis.some((s) => bump.emojis.map((v) => v.emoji).includes(s)));
  const latest = deduplicateAndSortEvents(initial, filteredBumps) as WithTimeIndexAndPrev[];
  return latest.slice(0, MARKETS_PER_PAGE);
};

export const filterStateEventsBySearchEmojis = (
  data: Types.StateEvent[],
  searchEmojis: string[]
): Types.StateEvent[] =>
  data.filter((d) =>
    searchEmojis.some((e) =>
      symbolBytesToEmojis(d.marketMetadata.emojiBytes)
        .emojis.map((v) => v.emoji)
        .includes(e)
    )
  );
