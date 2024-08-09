import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { isStateEvent, type Types } from "@sdk/types/types";
import { type EventStore } from "@store/event-store";
import { type FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { type TableCardProps } from "../table-card/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type EmojiPickerStore } from "@store/emoji-picker-store";

export type PropsWithTime = Omit<TableCardProps, "index" | "rowLength"> & {
  time: number;
};
export type PropsWithTimeAndIndex = TableCardProps & {
  time: number;
};
export type WithTimeIndexAndPrev = PropsWithTimeAndIndex & {
  prevIndex?: number;
};

export const marketDataToProps = (data: FetchSortedMarketDataReturn["markets"]): PropsWithTime[] =>
  data.map((market) => ({
    time: market.bumpTime,
    symbol: market.symbol,
    marketID: market.marketID,
    emojis: market.emojis,
    staticMarketCap: market.marketCap.toString(),
    staticVolume24H: market.dailyVolume.toString(),
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
    const emojiData = symbolBytesToEmojis(e.marketMetadata.emojiBytes);
    const { symbol, emojis } = emojiData;
    return {
      time: Number(e.stateMetadata.bumpTime),
      symbol,
      emojis,
      marketID: Number(marketID),
      staticMarketCap: (marketCap ?? 0).toString(),
      staticVolume24H: (volume24H ?? 0).toString(),
      trigger: e.stateMetadata.trigger,
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
          index: acc.length,
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
  // We don't need to filter the fetched data because it's already filtered and sorted by the
  // server. We only need to filter event store state events.
  const searchEmojis = getSearchEmojis();
  const initial = marketDataToProps(data);

  // If we're sorting by bump order, deduplicate and sort the events by bump order.
  const bumps = stateEventsToProps(stateFirehose, getMarket);
  // Filter only if there are search emojis.
  const filteredBumps = !searchEmojis.length
    ? bumps
    : bumps.filter((bump) => searchEmojis.some((s) => bump.emojis.map((v) => v.emoji).includes(s)));
  const latest = deduplicateAndSortEvents(initial, filteredBumps) as WithTimeIndexAndPrev[];
  return latest.slice(0, MARKETS_PER_PAGE);
};

export const toSerializedGridOrder = <T extends { marketID: number }>(data: T[]) =>
  data.map((v) => v.marketID).join(",");
