import { type TableCardProps } from "../table-card/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { type EmojiPickerStore } from "@/store/emoji-picker-store";
import { type HomePageProps } from "app/home/HomePage";
import { type EventStore } from "@/store/event/types";
import { type SymbolEmoji } from "@sdk/emoji_data";

export type PropsWithTime = Omit<TableCardProps, "index" | "rowLength"> & {
  time: number;
  searchEmojisKey: string;
};
export type PropsWithTimeAndIndex = TableCardProps & {
  time: number;
  searchEmojisKey: string;
};
export type WithTimeIndexAndPrev = PropsWithTimeAndIndex & {
  prevIndex?: number;
};

const toSearchEmojisKey = (searchEmojis: string[]) => `{${searchEmojis.join("")}}`;

export const marketDataToProps = (
  markets: HomePageProps["markets"],
  searchEmojis: string[]
): PropsWithTime[] =>
  markets.map((m) => ({
    time: Number(m.market.time),
    symbol: m.market.symbolData.symbol,
    marketID: Number(m.market.marketID),
    emojis: m.market.emojis,
    staticMarketCap: m.state.instantaneousStats.marketCap.toString(),
    staticVolume24H: m.dailyVolume.toString(),
    searchEmojisKey: toSearchEmojisKey(searchEmojis),
  }));

export const stateEventsToProps = (
  firehose: EventStore["stateFirehose"],
  getMarket: EventStore["getMarket"],
  searchEmojis: string[]
): PropsWithTime[] => {
  // State events are emitted with every single event related to bump order.
  // We can strictly only use state events to get the information we need to construct the bump
  // order data visually.
  return firehose.map((e) => {
    const marketID = Number(e.market.marketID);
    const { emojis } = e.market;
    const symbol = e.market.symbolData.symbol;
    const marketCap = e.state.instantaneousStats.marketCap;
    const volume24H = getMarket(e.market.symbolEmojis)?.dailyVolume;
    return {
      time: Number(e.market.time),
      symbol,
      emojis,
      marketID: Number(marketID),
      staticMarketCap: (marketCap ?? 0).toString(),
      staticVolume24H: (volume24H ?? 0).toString(),
      trigger: e.market.trigger,
      searchEmojisKey: toSearchEmojisKey(searchEmojis),
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
  markets,
  stateFirehose,
  getMarket,
  getSearchEmojis = () => [],
}: {
  markets: HomePageProps["markets"];
  stateFirehose: EventStore["stateFirehose"];
  getMarket: EventStore["getMarket"];
  getSearchEmojis?: EmojiPickerStore["getEmojis"];
}) => {
  // We don't need to filter the fetched data because it's already filtered and sorted by the
  // server. We only need to filter event store state events.
  const searchEmojis = getSearchEmojis() as Array<SymbolEmoji>;
  const initial = marketDataToProps(markets, searchEmojis);

  // If we're sorting by bump order, deduplicate and sort the events by bump order.
  const bumps = stateEventsToProps(stateFirehose, getMarket, searchEmojis);
  // Filter only if there are search emojis.
  const filteredBumps = !searchEmojis.length
    ? bumps
    : bumps.filter((bump) => searchEmojis.some((s) => bump.emojis.map((v) => v.emoji).includes(s)));
  const latest = deduplicateAndSortEvents(initial, filteredBumps) as WithTimeIndexAndPrev[];
  return latest.slice(0, MARKETS_PER_PAGE);
};

export const toSerializedGridOrder = <T extends { marketID: number }>(data: T[]) =>
  data.map((v) => v.marketID).join(",");
